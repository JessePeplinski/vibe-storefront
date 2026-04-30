import { ImageResponse } from "next/og";
import {
  SiteSocialPreviewImage,
  StorefrontSocialPreviewImage
} from "@/components/social-preview-image";
import { socialImageSize } from "@/lib/seo";
import { getPublicStorefrontBySlug } from "@/lib/storefronts";

export const alt = "Generated Vibe Storefront social preview";
export const contentType = "image/png";
export const size = socialImageSize;

type StorefrontSocialImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: StorefrontSocialImageProps) {
  const { slug } = await params;
  const storefront = await getPublicStorefrontBySlug(slug);

  if (!storefront) {
    return new ImageResponse(
      <SiteSocialPreviewImage
        description="This shared storefront could not be found."
        title="Storefront not found"
      />,
      size
    );
  }

  return new ImageResponse(
    <StorefrontSocialPreviewImage
      content={storefront.content}
      idea={storefront.idea}
    />,
    size
  );
}
