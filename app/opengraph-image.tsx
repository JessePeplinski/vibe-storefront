import { ImageResponse } from "next/og";
import { SiteSocialPreviewImage } from "@/components/social-preview-image";
import { socialImageSize } from "@/lib/seo";

export const alt =
  "Vibe Storefront social preview for generated storefront concepts";
export const contentType = "image/png";
export const size = socialImageSize;

export default function Image() {
  return new ImageResponse(<SiteSocialPreviewImage />, size);
}
