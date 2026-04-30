import type { Metadata } from "next";
import { appBaseUrl } from "@/lib/env";
import type { StorefrontRecord } from "@/lib/storefront-schema";

export const siteName = "Vibe Storefront";
export const siteDescription =
  "Turn a raw product idea into a shareable storefront concept for fast market validation.";
export const siteOgDescription =
  "Generate a product story, page, CTA, palette, reviews, and product imagery from a plain-English idea.";
export const siteGithubUrl =
  "https://github.com/JessePeplinski/vibe-storefront";
export const socialImageSize = {
  height: 630,
  width: 1200
} as const;

const defaultSocialImageAlt =
  "Vibe Storefront social preview for generated storefront concepts";

type SocialImageMetadata = {
  alt?: string;
  url?: string;
};

type PageMetadataParams = {
  description: string;
  image?: SocialImageMetadata;
  path: string;
  title: string;
};

export function siteOrigin(): string {
  return new URL(appBaseUrl()).origin;
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteOrigin()).toString();
}

export function defaultSocialImageUrl(): string {
  return absoluteUrl("/opengraph-image");
}

export function storefrontPublicUrl(slug: string): string {
  return absoluteUrl(`/s/${encodeURIComponent(slug)}`);
}

export function storefrontSocialImageUrl(slug: string): string {
  return absoluteUrl(`/s/${encodeURIComponent(slug)}/opengraph-image`);
}

export function truncateForSocialImage(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function buildPageMetadata({
  description,
  image,
  path,
  title
}: PageMetadataParams): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image?.url ?? defaultSocialImageUrl();
  const imageAlt = image?.alt ?? defaultSocialImageAlt;

  return {
    alternates: {
      canonical: url
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: imageAlt,
          height: socialImageSize.height,
          url: imageUrl,
          width: socialImageSize.width
        }
      ],
      siteName,
      title,
      type: "website",
      url
    },
    robots: {
      follow: true,
      index: true
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [
        {
          alt: imageAlt,
          url: imageUrl
        }
      ],
      title
    }
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function websiteJsonLd() {
  return {
    "@id": absoluteUrl("/#website"),
    "@type": "WebSite",
    description: siteDescription,
    name: siteName,
    url: absoluteUrl("/")
  };
}

function webApplicationJsonLd() {
  return {
    "@id": absoluteUrl("/#webapplication"),
    "@type": "WebApplication",
    applicationCategory: "BusinessApplication",
    description: siteOgDescription,
    name: siteName,
    operatingSystem: "Web",
    url: absoluteUrl("/")
  };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      websiteJsonLd(),
      webApplicationJsonLd(),
      {
        "@id": absoluteUrl("/#webpage"),
        "@type": "WebPage",
        description: siteDescription,
        isPartOf: {
          "@id": absoluteUrl("/#website")
        },
        name: "Validate product ideas with a storefront",
        primaryImageOfPage: {
          "@type": "ImageObject",
          height: socialImageSize.height,
          url: defaultSocialImageUrl(),
          width: socialImageSize.width
        },
        url: absoluteUrl("/")
      }
    ]
  };
}

export function collectionPageJsonLd(storefronts: StorefrontRecord[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      websiteJsonLd(),
      {
        "@id": absoluteUrl("/storefronts#webpage"),
        "@type": "CollectionPage",
        description: "Browse public storefront concepts generated with Vibe Storefront.",
        isPartOf: {
          "@id": absoluteUrl("/#website")
        },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: storefronts.map((storefront, index) => ({
            "@type": "ListItem",
            name: storefront.content.name,
            position: index + 1,
            url: storefrontPublicUrl(storefront.slug)
          }))
        },
        name: "All storefronts",
        primaryImageOfPage: {
          "@type": "ImageObject",
          height: socialImageSize.height,
          url: defaultSocialImageUrl(),
          width: socialImageSize.width
        },
        url: absoluteUrl("/storefronts")
      }
    ]
  };
}

export function storefrontPageJsonLd(storefront: StorefrontRecord) {
  const publicUrl = storefrontPublicUrl(storefront.slug);
  const imageUrl = storefrontSocialImageUrl(storefront.slug);
  const conceptId = `${publicUrl}#concept`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      websiteJsonLd(),
      webApplicationJsonLd(),
      {
        "@id": `${publicUrl}#webpage`,
        "@type": "WebPage",
        dateModified: storefront.updated_at,
        datePublished: storefront.created_at,
        description: storefront.content.tagline,
        isPartOf: {
          "@id": absoluteUrl("/#website")
        },
        mainEntity: {
          "@id": conceptId
        },
        name: storefront.content.product.name,
        primaryImageOfPage: {
          "@type": "ImageObject",
          height: socialImageSize.height,
          url: imageUrl,
          width: socialImageSize.width
        },
        url: publicUrl
      },
      {
        "@id": conceptId,
        "@type": "CreativeWork",
        about: storefront.idea,
        abstract: storefront.content.tagline,
        creator: {
          "@id": absoluteUrl("/#webapplication")
        },
        dateCreated: storefront.created_at,
        dateModified: storefront.updated_at,
        description: storefront.content.hero.body,
        headline: storefront.content.hero.headline,
        image: imageUrl,
        name: storefront.content.name,
        text: storefront.content.product.description,
        url: publicUrl
      }
    ]
  };
}
