import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
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
  StorefrontRecord
} from "@/lib/storefront-schema";

export const runtime = "nodejs";
export const maxDuration = 180;

const GUEST_COOKIE_NAME = "vibe_storefront_guest_id";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6).max(220)
});

const guestSessionSchema = z.string().uuid();

function shareUrlForSlug(slug: string): string {
  return `${appBaseUrl()}/s/${slug}`;
}

async function generateStorefrontWithProductImage(
  idea: string
): Promise<{ content: StorefrontContent; slug: string }> {
  const content = await generateStorefront(idea);
  const slug = buildStorefrontSlug(content.name);
  const image = await generateProductImage({ content, idea, slug });

  return {
    content: {
      ...content,
      product: {
        ...content.product,
        image
      }
    },
    slug
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

      const { content, slug } = await generateStorefrontWithProductImage(
        parsed.data.idea
      );
      const storefront = await createGeneratedStorefront({
        ownerClerkUserId: userId,
        idea: parsed.data.idea,
        content,
        slug
      });

      return NextResponse.json(
        {
          storefront,
          shareUrl: shareUrlForSlug(storefront.slug),
          status: "created"
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

    const { content, slug } = await generateStorefrontWithProductImage(
      parsed.data.idea
    );
    const storefront = await createGeneratedStorefront({
      anonymousSessionId: guestSessionId,
      idea: parsed.data.idea,
      content,
      slug
    });

    return jsonWithGuestCookie(
      {
        storefront,
        shareUrl: shareUrlForSlug(storefront.slug),
        status: "created"
      },
      { status: 201 },
      guestSessionId
    );
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to generate storefront.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
