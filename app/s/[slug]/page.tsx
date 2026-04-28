import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import { appBaseUrl } from "@/lib/env";
import { getPublicStorefrontBySlug } from "@/lib/storefronts";

type PublicStorefrontPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: PublicStorefrontPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await getPublicStorefrontBySlug(slug);

  if (!storefront) {
    return {
      title: "Storefront not found"
    };
  }

  const displayName = storefront.content.product.name;
  const title = `${displayName} | Vibe Storefront`;
  const description = storefront.content.tagline;
  const publicUrl = `${appBaseUrl()}/s/${storefront.slug}`;
  const image = storefront.content.product.image;

  return {
    title,
    description,
    openGraph: {
      title: displayName,
      description,
      images: image
        ? [
            {
              alt: image.alt,
              url: image.url
            }
          ]
        : undefined,
      siteName: "Vibe Storefront",
      type: "website",
      url: publicUrl
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: displayName,
      description,
      images: image ? [image.url] : undefined
    }
  };
}

export default async function PublicStorefrontPage({
  params
}: PublicStorefrontPageProps) {
  const { slug } = await params;
  const storefront = await getPublicStorefrontBySlug(slug);

  if (!storefront) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <StorefrontRenderer
        content={storefront.content}
        idea={storefront.idea}
        variant="landing"
      />
    </main>
  );
}
