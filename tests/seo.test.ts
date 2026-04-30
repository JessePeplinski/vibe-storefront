import { afterEach, describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildPageMetadata,
  defaultSocialImageUrl,
  serializeJsonLd,
  storefrontSocialImageUrl,
  truncateForSocialImage
} from "@/lib/seo";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe("SEO helpers", () => {
  afterEach(() => {
    if (originalAppUrl) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it("builds canonical and first-party social image URLs from the configured app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";

    expect(absoluteUrl("/storefronts")).toBe("https://vibe.example/storefronts");
    expect(defaultSocialImageUrl()).toBe("https://vibe.example/opengraph-image");
    expect(storefrontSocialImageUrl("ember-table-abc123")).toBe(
      "https://vibe.example/s/ember-table-abc123/opengraph-image"
    );
  });

  it("builds full page metadata for SEO and social sharing", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";

    expect(
      buildPageMetadata({
        description: "Page description",
        path: "/example",
        title: "Example page"
      })
    ).toMatchObject({
      alternates: {
        canonical: "https://vibe.example/example"
      },
      openGraph: {
        description: "Page description",
        images: [
          expect.objectContaining({
            height: 630,
            url: "https://vibe.example/opengraph-image",
            width: 1200
          })
        ],
        title: "Example page",
        url: "https://vibe.example/example"
      },
      twitter: {
        card: "summary_large_image",
        images: [
          expect.objectContaining({
            url: "https://vibe.example/opengraph-image"
          })
        ],
        title: "Example page"
      }
    });
  });

  it("serializes JSON-LD without allowing script breakouts", () => {
    expect(serializeJsonLd({ value: "</script><script>alert(1)</script>" }))
      .toBe(
        '{"value":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}'
      );
  });

  it("normalizes and truncates social image text", () => {
    expect(truncateForSocialImage("  one   two three  ", 9)).toBe("one two...");
  });
});
