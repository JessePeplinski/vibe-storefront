import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  CONTENT_CANNOT_BE_GENERATED_ERROR,
  containsBlockedNsfwTerm,
  storefrontContentContainsBlockedTerms
} from "@/lib/content-safety";
import { generateStorefront } from "@/lib/codex-storefront";
import { isCurrentUserAdmin } from "@/lib/admin";
import { appBaseUrl } from "@/lib/env";
import { SIGNED_IN_STOREFRONT_GENERATION_LIMIT } from "@/lib/generation-quota";
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
import { claimGenerationJob, createGenerationJob, finishGenerationJob, getLatestGenerationJob } from "@/lib/generation-jobs";
import { isPendingGenerationJob } from "@/lib/generation-job";
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
  `Generation is currently limited to ${SIGNED_IN_STOREFRONT_GENERATION_LIMIT} storefronts per account.`;
const GENERATION_RATE_LIMIT_ERROR =
  "Too many generation attempts. Try again shortly.";

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6),
  background: z.boolean().default(false)
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

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "unknown error";
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
    } catch (caught) {
      console.warn(
        JSON.stringify({
          level: "warn",
          msg: "product_image_generation_attempt_failed",
          route: "/api/storefronts",
          attempt,
          maxAttempts: PRODUCT_IMAGE_GENERATION_ATTEMPTS,
          error: errorMessage(caught)
        })
      );
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

async function executeGeneration(userId: string, idea: string, reservation: { id: string } | null) {
  const generatedStorefront = await (async () => {
    try {
      const { content, slug, usageCost, warning } =
        await generateStorefrontWithOptionalProductImage(idea);
      const publicUsageCost = toPublicUsageCost(usageCost);
      const storefront = await createGeneratedStorefront({
        ownerClerkUserId: userId,
        idea,
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
      if (reservation) {
        await releaseReservedGenerationSlot(reservation.id);
      }
      throw caught;
    }
  })();

  if (reservation) {
    try {
      await completeStorefrontGenerationSlot({
        reservationId: reservation.id,
        storefrontId: generatedStorefront.storefront.id
      });
    } catch {
      // The reserved pending slot still blocks repeat generation.
    }
  }

  return {
    storefront: generatedStorefront.storefrontWithUsageCost,
    shareUrl: shareUrlForSlug(generatedStorefront.storefront.slug),
    status: "created" as const,
    usageCost: generatedStorefront.publicUsageCost,
    warning: generatedStorefront.warning
  };
}

async function runBackgroundGeneration(jobId: string, userId: string, idea: string, reservation: { id: string } | null) {
  let generated;
  try {
    generated = await executeGeneration(userId, idea, reservation);
  } catch (caught) {
    const message = caught instanceof Error && caught.message === CONTENT_CANNOT_BE_GENERATED_ERROR
      ? CONTENT_CANNOT_BE_GENERATED_ERROR
      : "Unable to generate this storefront. Please try again.";
    await finishGenerationJob(jobId, { error: message });
    return;
  }
  // If this write fails, status recovery finds the already saved storefront.
  await finishGenerationJob(jobId, { storefrontId: generated.storefront.id, warning: generated.warning });
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
      { error: "Enter a product idea with at least 6 characters." },
      { status: 400 }
    );
  }

  if (containsBlockedNsfwTerm(parsed.data.idea)) {
    return contentCannotBeGeneratedResponse();
  }

  try {
    if (parsed.data.background) {
      const activeJob = await getLatestGenerationJob(userId);
      if (activeJob && isPendingGenerationJob(activeJob)) {
        return NextResponse.json({ job: activeJob }, { status: 202 });
      }
    }
    const existingStorefront = await getStorefrontByOwnerAndIdea({
      ownerClerkUserId: userId,
      idea: parsed.data.idea
    });

    if (existingStorefront) {
      return NextResponse.json(
        existingStorefrontPayload(existingStorefront, "existing_prompt_storefront")
      );
    }

    const isAdmin = await isCurrentUserAdmin();

    if (!isAdmin) {
      const ownerStorefronts = await listStorefrontsForOwner(userId);

      if (ownerStorefronts.length >= SIGNED_IN_STOREFRONT_GENERATION_LIMIT) {
        return generationQuotaExceededResponse(ownerStorefronts[0]);
      }
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

    if (parsed.data.background) {
      const { job, created } = await createGenerationJob(userId, parsed.data.idea);
      if (!created) return NextResponse.json({ job }, { status: 202 });
      let reservation: { id: string } | null = null;
      try {
        reservation = isAdmin ? null : await reserveStorefrontGenerationSlot(userId);
        if (!isAdmin && !reservation) {
          await finishGenerationJob(job.id, { error: GENERATION_QUOTA_EXCEEDED_ERROR });
          return generationQuotaExceededResponse();
        }
        if (!await claimGenerationJob(job.id, reservation?.id ?? null)) {
          throw new Error("Unable to start generation worker.");
        }
        const reservedSlot = reservation;
        after(async () => {
          try {
            await runBackgroundGeneration(job.id, userId, parsed.data.idea, reservedSlot);
          } catch {
            // A killed worker or failed status write is reconciled by the status endpoint.
            console.error("storefront_generation_job_status_unavailable");
          }
        });
        return NextResponse.json({ job: { ...job, status: "running" } }, { status: 202 });
      } catch (caught) {
        if (reservation) await releaseReservedGenerationSlot(reservation.id);
        await finishGenerationJob(job.id, { error: "Unable to start generation. Please try again." });
        throw caught;
      }
    }

    const reservation = isAdmin ? null : await reserveStorefrontGenerationSlot(userId);
    if (!isAdmin && !reservation) return generationQuotaExceededResponse();
    return NextResponse.json(await executeGeneration(userId, parsed.data.idea, reservation), { status: 201 });

  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to generate storefront.";
    const status =
      message === CONTENT_CANNOT_BE_GENERATED_ERROR ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
