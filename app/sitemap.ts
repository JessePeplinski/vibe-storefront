import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  defaultSocialImageUrl,
  storefrontPublicUrl,
  storefrontSocialImageUrl
} from "@/lib/seo";
import { listPublishedStorefronts } from "@/lib/storefronts";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const storefronts = await listPublishedStorefronts();

  return [
    {
      changeFrequency: "weekly",
      images: [defaultSocialImageUrl()],
      priority: 1,
      url: absoluteUrl("/")
    },
    {
      changeFrequency: "daily",
      images: [defaultSocialImageUrl()],
      priority: 0.8,
      url: absoluteUrl("/storefronts")
    },
    ...storefronts.map((storefront) => ({
      changeFrequency: "weekly" as const,
      images: [storefrontSocialImageUrl(storefront.slug)],
      lastModified: storefront.updated_at || storefront.created_at,
      priority: 0.7,
      url: storefrontPublicUrl(storefront.slug)
    }))
  ];
}
