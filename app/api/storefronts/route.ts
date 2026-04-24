import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateStorefront } from "@/lib/codex-storefront";
import { appBaseUrl } from "@/lib/env";
import {
  createStorefront,
  getStorefrontByAnonymousSession,
  getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner
} from "@/lib/storefronts";

export const runtime = "nodejs";
export const maxDuration = 60;

const GUEST_COOKIE_NAME = "vibe_storefront_guest_id";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6).max(220)
});

const guestSessionSchema = z.string().uuid();

function shareUrlForSlug(slug: string): string {
  return `${appBaseUrl()}/s/${slug}`;
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

      const content = await generateStorefront(parsed.data.idea);
      const storefront = await createStorefront({
        ownerClerkUserId: userId,
        idea: parsed.data.idea,
        content
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

    const content = await generateStorefront(parsed.data.idea);
    const storefront = await createStorefront({
      anonymousSessionId: guestSessionId,
      idea: parsed.data.idea,
      content
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
