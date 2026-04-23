import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateStorefront } from "@/lib/codex-storefront";
import { appBaseUrl } from "@/lib/env";
import { createStorefront, listStorefrontsForOwner } from "@/lib/storefronts";

export const runtime = "nodejs";
export const maxDuration = 60;

const createStorefrontRequestSchema = z.object({
  idea: z.string().trim().min(6).max(220)
});

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createStorefrontRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a product idea between 6 and 220 characters." },
      { status: 400 }
    );
  }

  try {
    const content = await generateStorefront(parsed.data.idea);
    const storefront = await createStorefront({
      ownerClerkUserId: userId,
      idea: parsed.data.idea,
      content
    });
    const shareUrl = `${appBaseUrl()}/s/${storefront.slug}`;

    return NextResponse.json({ storefront, shareUrl }, { status: 201 });
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to generate storefront.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
