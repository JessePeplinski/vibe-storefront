import type { StorefrontContent } from "@/lib/storefront-schema";

type StorefrontPreviewImageProps = {
  className?: string;
  content: StorefrontContent;
};

function cssImageUrl(url: string): string {
  return `url("${url.replace(/"/g, '\\"')}")`;
}

export function StorefrontPreviewImage({
  className = "",
  content
}: StorefrontPreviewImageProps) {
  const image = content.product.image;
  const gradient = `linear-gradient(135deg, ${content.theme.palette.primary}, ${content.theme.palette.accent})`;
  const background = image
    ? `linear-gradient(135deg, ${content.theme.palette.primary}cc, ${content.theme.palette.accent}66), ${cssImageUrl(image.url)}`
    : gradient;

  return (
    <div
      aria-hidden={image ? undefined : true}
      aria-label={image?.alt}
      className={`border border-black/10 bg-cover bg-center ${className}`}
      role={image ? "img" : undefined}
      style={{ backgroundImage: background }}
    />
  );
}
