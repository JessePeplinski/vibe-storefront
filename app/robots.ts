import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteOrigin(),
    rules: {
      allow: "/",
      disallow: ["/api/", "/dashboard", "/dashboard/", "/sign-in", "/sign-in/"],
      userAgent: "*"
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
