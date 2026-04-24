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

  const title = `${storefront.content.name} | Vibe Storefront`;
  const description = storefront.content.tagline;
  const publicUrl = `${appBaseUrl()}/s/${storefront.slug}`;

  return {
    title,
    description,
    openGraph: {
      title: storefront.content.name,
      description,
      siteName: "Vibe Storefront",
      type: "website",
      url: publicUrl
    },
    twitter: {
      card: "summary",
      title: storefront.content.name,
      description
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
