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
  getStorefrontByAnonymousSession,
  getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner
} from "@/lib/storefronts";
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

const GUEST_COOKIE_NAME = "vibe_storefront_guest_id";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const PRODUCT_IMAGE_GENERATION_ATTEMPTS = 3;
const PRODUCT_IMAGE_GENERATION_WARNING =
  "Storefront created, but the product image could not be generated.";

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6).max(220)
});

const guestSessionSchema = z.string().uuid();

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

function getGuestSessionId(request: NextRequest): string {
  const existingGuestId = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  if (guestSessionSchema.safeParse(existingGuestId).success) {
    return existingGuestId as string;
  }

  return crypto.randomUUID();
}

function jsonWithGuestCookie(
  body: unknown,
  init: ResponseInit,
  guestSessionId: string
) {
  const response = NextResponse.json(body, init);
  response.cookies.set(GUEST_COOKIE_NAME, guestSessionId, {
    httpOnly: true,
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
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
    if (userId) {
      const existingStorefront = await getStorefrontByOwnerAndIdea({
        ownerClerkUserId: userId,
        idea: parsed.data.idea
      });

      if (existingStorefront) {
        return NextResponse.json({
          storefront: existingStorefront,
          shareUrl: shareUrlForSlug(existingStorefront.slug),
          status: "existing_prompt_storefront"
        });
      }

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

      return NextResponse.json(
        {
          storefront: storefrontWithUsageCost,
          shareUrl: shareUrlForSlug(storefront.slug),
          status: "created",
          usageCost: publicUsageCost,
          warning
        },
        { status: 201 }
      );
    }

    const guestSessionId = getGuestSessionId(request);
    const existingStorefront =
      await getStorefrontByAnonymousSession(guestSessionId);

    if (existingStorefront) {
      return jsonWithGuestCookie(
        {
          error: `This browser already generated ${existingStorefront.content.name}; open it below or sign in to create more storefronts.`,
          storefront: existingStorefront,
          shareUrl: shareUrlForSlug(existingStorefront.slug),
          status: "existing_guest_storefront"
        },
        { status: 409 },
        guestSessionId
      );
    }

    const { content, slug, usageCost, warning } =
      await generateStorefrontWithOptionalProductImage(parsed.data.idea);
    const publicUsageCost = toPublicUsageCost(usageCost);
    const storefront = await createGeneratedStorefront({
      anonymousSessionId: guestSessionId,
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

    return jsonWithGuestCookie(
      {
        storefront: storefrontWithUsageCost,
        shareUrl: shareUrlForSlug(storefront.slug),
        status: "created",
        usageCost: publicUsageCost,
        warning
      },
      { status: 201 },
      guestSessionId
    );
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to generate storefront.";
    const status =
      message === CONTENT_CANNOT_BE_GENERATED_ERROR ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
