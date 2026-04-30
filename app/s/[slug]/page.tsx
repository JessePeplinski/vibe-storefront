import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import {
  buildPageMetadata,
  storefrontPageJsonLd,
  storefrontPublicUrl,
  storefrontSocialImageUrl
} from "@/lib/seo";
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

  return buildPageMetadata({
    description,
    image: {
      alt: `${displayName} generated storefront preview`,
      url: storefrontSocialImageUrl(storefront.slug)
    },
    path: storefrontPublicUrl(storefront.slug),
    title
  });
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
    <>
      <JsonLd data={storefrontPageJsonLd(storefront)} />
      <main className="min-h-screen">
        <StorefrontRenderer
          content={storefront.content}
          idea={storefront.idea}
          variant="landing"
        />
      </main>
    </>
  );
}
