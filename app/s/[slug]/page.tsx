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

  return {
    title: `${storefront.content.name} | Vibe Storefront`,
    description: storefront.content.tagline
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StorefrontRenderer
        content={storefront.content}
        idea={storefront.idea}
        publicUrl={`${appBaseUrl()}/s/${storefront.slug}`}
      />
    </main>
  );
}
