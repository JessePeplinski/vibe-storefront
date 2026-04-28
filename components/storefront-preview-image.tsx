import Image from "next/image";
import type { StorefrontContent } from "@/lib/storefront-schema";

type StorefrontPreviewImageProps = {
  className?: string;
  content: StorefrontContent;
  preload?: boolean;
  sizes: string;
};

export function StorefrontPreviewImage({
  className = "",
  content,
  preload = false,
  sizes
}: StorefrontPreviewImageProps) {
  const image = content.product.image;
  const gradient = `linear-gradient(135deg, ${content.theme.palette.primary}, ${content.theme.palette.accent})`;
  const imageOverlay = `linear-gradient(135deg, ${content.theme.palette.primary}cc, ${content.theme.palette.accent}66)`;

  return (
    <div
      aria-hidden={image ? undefined : true}
      className={`relative overflow-hidden border border-black/10 ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {image && (
        <>
          <Image
            alt={image.alt}
            className="object-cover"
            fill
            preload={preload}
            sizes={sizes}
            src={image.url}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: imageOverlay }}
          />
        </>
      )}
    </div>
  );
}
