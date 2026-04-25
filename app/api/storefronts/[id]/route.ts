import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { deleteProductImage } from "@/lib/product-images";
import { deleteStorefrontForOwner } from "@/lib/storefronts";

export const runtime = "nodejs";

const storefrontIdSchema = z.string().uuid();

type StorefrontRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function cleanupDeletedStorefrontImage(
  storagePath: string | undefined
): Promise<void> {
  if (!storagePath) {
    return;
  }

  try {
    await deleteProductImage(storagePath);
  } catch {
    // Deleting the row is the source of truth for removing public access.
  }
}

export async function DELETE(
  _request: Request,
  { params }: StorefrontRouteContext
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = storefrontIdSchema.safeParse(id);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid storefront id." },
      { status: 400 }
    );
  }

  try {
    const deletedStorefront = await deleteStorefrontForOwner({
      ownerClerkUserId: userId,
      storefrontId: parsed.data
    });

    if (!deletedStorefront) {
      return NextResponse.json(
        { error: "Storefront not found." },
        { status: 404 }
      );
    }

    await cleanupDeletedStorefrontImage(
      deletedStorefront.content.product.image?.storagePath
    );

    return NextResponse.json({ deletedStorefrontId: deletedStorefront.id });
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Unable to delete storefront.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
