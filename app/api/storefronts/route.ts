import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  CONTENT_CANNOT_BE_GENERATED_ERROR,
  containsBlockedNsfwTerm,
  storefrontContentContainsBlockedTerms
} from "@/lib/content-safety";
import { generateStorefront } from "@/lib/codex-storefront";
import { appBaseUrl } from "@/lib/env";
import { deleteProductImage, generateProductImage } from "@/lib/product-images";
import { buildStorefrontSlug } from "@/lib/slug";
import {
  createStorefront,
  completeStorefrontGenerationSlot,
  getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner,
  releaseStorefrontGenerationSlot,
  reserveStorefrontGenerationSlot
} from "@/lib/storefronts";
import { checkStorefrontGenerationRateLimit } from "@/lib/generation-rate-limit";
import type {
  StorefrontContent,
  StorefrontProductImage,
  StorefrontRecord
} from "@/lib/storefront-schema";
import {
  estimateStorefrontGenerationCost,
  toPublicUsageCost,
  type OpenAIImageUsage,
  type UsageCostBreakdown
} from "@/lib/usage-costs";

export const runtime = "nodejs";
export const maxDuration = 180;

const PRODUCT_IMAGE_GENERATION_ATTEMPTS = 3;
const PRODUCT_IMAGE_GENERATION_WARNING =
  "Storefront created, but the product image could not be generated.";
const GENERATION_REQUIRES_SIGN_IN_ERROR = "Sign in to generate a storefront.";
const GENERATION_QUOTA_EXCEEDED_ERROR =
  "Generation is currently limited to one storefront per account.";
const GENERATION_RATE_LIMIT_ERROR =
  "Too many generation attempts. Try again shortly.";

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6).max(220)
});

type ProductImageGenerationResult = {
  image: StorefrontProductImage;
  model: string;
  usage: OpenAIImageUsage | null;
};

function contentCannotBeGeneratedResponse() {
  return NextResponse.json(
    { error: CONTENT_CANNOT_BE_GENERATED_ERROR },
    { status: 400 }
  );
}

function shareUrlForSlug(slug: string): string {
  return `${appBaseUrl()}/s/${slug}`;
}

function existingStorefrontPayload(
  storefront: StorefrontRecord,
  status: "existing_prompt_storefront" | "generation_quota_exceeded"
) {
  return {
    storefront,
    shareUrl: shareUrlForSlug(storefront.slug),
    status
  };
}

function generationQuotaExceededResponse(storefront?: StorefrontRecord) {
  return NextResponse.json(
    {
      error: GENERATION_QUOTA_EXCEEDED_ERROR,
      ...(storefront
        ? existingStorefrontPayload(storefront, "generation_quota_exceeded")
        : { status: "generation_quota_exceeded" })
    },
    { status: 429 }
  );
}

async function generateProductImageWithRetries(params: {
  content: StorefrontContent;
  idea: string;
  slug: string;
}): Promise<ProductImageGenerationResult | null> {
  for (
    let attempt = 1;
    attempt <= PRODUCT_IMAGE_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await generateProductImage(params);
    } catch {
      // The caller falls back to saving the storefront without an image.
    }
  }

  return null;
}

async function generateStorefrontWithOptionalProductImage(
  idea: string
): Promise<{
  content: StorefrontContent;
  slug: string;
  usageCost: UsageCostBreakdown;
  warning?: string;
}> {
  const generatedStorefront = await generateStorefront(idea);

  if (storefrontContentContainsBlockedTerms(generatedStorefront.content)) {
    throw new Error(CONTENT_CANNOT_BE_GENERATED_ERROR);
  }

  const slug = buildStorefrontSlug(generatedStorefront.content.name);
  const image = await generateProductImageWithRetries({
    content: generatedStorefront.content,
    idea,
    slug
  });
  const usageCost = estimateStorefrontGenerationCost({
    imageModel: image?.model,
    imageUsage: image?.usage ?? null,
    textModel: generatedStorefront.model,
    textUsage: generatedStorefront.usage
  });

  if (!image) {
    return {
      content: generatedStorefront.content,
      slug,
      usageCost,
      warning: PRODUCT_IMAGE_GENERATION_WARNING
    };
  }

  return {
    content: {
      ...generatedStorefront.content,
      product: {
        ...generatedStorefront.content.product,
        image: image.image
      }
    },
    slug,
    usageCost
  };
}

async function cleanupProductImageAfterFailedInsert(
  content: StorefrontContent
): Promise<void> {
  const storagePath = content.product.image?.storagePath;

  if (!storagePath) {
    return;
  }

  try {
    await deleteProductImage(storagePath);
  } catch {
    // The original persistence error is more useful to return to the client.
  }
}

async function createGeneratedStorefront(
  params: Parameters<typeof createStorefront>[0]
): Promise<StorefrontRecord> {
  try {
    return await createStorefront(params);
  } catch (caught) {
    await cleanupProductImageAfterFailedInsert(params.content);
    throw caught;
  }
}

async function releaseReservedGenerationSlot(reservationId: string) {
  try {
    await releaseStorefrontGenerationSlot(reservationId);
  } catch {
    // Keep the original generation error intact.
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storefronts = await listStorefrontsForOwner(userId);
  return NextResponse.json({ storefronts });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: GENERATION_REQUIRES_SIGN_IN_ERROR },
      { status: 401 }
    );
  }

  const parsed = createStorefrontRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a product idea between 6 and 220 characters." },
      { status: 400 }
    );
  }

  if (containsBlockedNsfwTerm(parsed.data.idea)) {
    return contentCannotBeGeneratedResponse();
  }

  try {
    const existingStorefront = await getStorefrontByOwnerAndIdea({
      ownerClerkUserId: userId,
      idea: parsed.data.idea
    });

    if (existingStorefront) {
      return NextResponse.json(
        existingStorefrontPayload(existingStorefront, "existing_prompt_storefront")
      );
    }

    const ownerStorefronts = await listStorefrontsForOwner(userId);

    if (ownerStorefronts.length > 0) {
      return generationQuotaExceededResponse(ownerStorefronts[0]);
    }

    const rateLimit = checkStorefrontGenerationRateLimit(userId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: GENERATION_RATE_LIMIT_ERROR },
        {
          headers: {
            "Retry-After": rateLimit.retryAfterSeconds.toString()
          },
          status: 429
        }
      );
    }

    const reservation = await reserveStorefrontGenerationSlot(userId);

    if (!reservation) {
      return generationQuotaExceededResponse();
    }

    const generatedStorefront = await (async () => {
      try {
        const { content, slug, usageCost, warning } =
          await generateStorefrontWithOptionalProductImage(parsed.data.idea);
        const publicUsageCost = toPublicUsageCost(usageCost);
        const storefront = await createGeneratedStorefront({
          ownerClerkUserId: userId,
          idea: parsed.data.idea,
          content,
          generationCost: publicUsageCost,
          slug
        });
        const storefrontWithUsageCost = publicUsageCost
          ? {
              ...storefront,
              generation_cost: publicUsageCost
            }
          : storefront;

        return {
          publicUsageCost,
          storefront,
          storefrontWithUsageCost,
          warning
        };
      } catch (caught) {
        await releaseReservedGenerationSlot(reservation.id);
        throw caught;
      }
    })();

    try {
      await completeStorefrontGenerationSlot({
        reservationId: reservation.id,
        storefrontId: generatedStorefront.storefront.id
      });
    } catch {
      // The reserved pending slot still blocks repeat generation.
    }

    return NextResponse.json(
      {
        storefront: generatedStorefront.storefrontWithUsageCost,
        shareUrl: shareUrlForSlug(generatedStorefront.storefront.slug),
        status: "created",
        usageCost: generatedStorefront.publicUsageCost,
        warning: generatedStorefront.warning
      },
      { status: 201 }
    );
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to generate storefront.";
    const status =
      message === CONTENT_CANNOT_BE_GENERATED_ERROR ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
