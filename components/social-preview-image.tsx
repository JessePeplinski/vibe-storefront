import {
  siteName,
  socialImageSize,
  truncateForSocialImage
} from "@/lib/seo";
import type { StorefrontContent } from "@/lib/storefront-schema";

const baseOuterStyle = {
  alignItems: "stretch",
  background: "#071b15",
  color: "#ffffff",
  display: "flex",
  height: "100%",
  padding: 56,
  width: "100%"
} as const;

const panelStyle = {
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 28,
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  justifyContent: "space-between",
  overflow: "hidden",
  padding: 56
} as const;

const eyebrowStyle = {
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.1,
  opacity: 0.78
} as const;

const titleStyle = {
  fontSize: 82,
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 0.96,
  marginTop: 24,
  maxWidth: 900
} as const;

const descriptionStyle = {
  fontSize: 34,
  fontWeight: 600,
  letterSpacing: 0,
  lineHeight: 1.22,
  marginTop: 28,
  maxWidth: 840,
  opacity: 0.84
} as const;

const footerStyle = {
  alignItems: "center",
  display: "flex",
  fontSize: 26,
  fontWeight: 800,
  justifyContent: "space-between",
  letterSpacing: 0,
  lineHeight: 1
} as const;

const markStyle = {
  alignItems: "center",
  background: "#ffffff",
  borderRadius: 18,
  color: "#08251d",
  display: "flex",
  fontSize: 34,
  fontWeight: 900,
  height: 70,
  justifyContent: "center",
  width: 70
} as const;

type SiteSocialPreviewImageProps = {
  description?: string;
  title?: string;
};

type StorefrontSocialPreviewImageProps = {
  content: StorefrontContent;
  idea: string;
};

export function SiteSocialPreviewImage({
  description = "Turn a raw product idea into a shareable storefront concept for fast market validation.",
  title = "Validate product ideas with a storefront."
}: SiteSocialPreviewImageProps) {
  return (
    <div
      style={{
        ...baseOuterStyle,
        background:
          "linear-gradient(135deg, #061f18 0%, #123d33 52%, #0b1724 100%)"
      }}
    >
      <div
        style={{
          ...panelStyle,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={eyebrowStyle}>AI storefront generator</div>
          <div style={titleStyle}>{title}</div>
          <div style={descriptionStyle}>{description}</div>
        </div>
        <div style={footerStyle}>
          <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <div style={markStyle}>VS</div>
            <div>{siteName}</div>
          </div>
          <div style={{ opacity: 0.72 }}>
            {`${socialImageSize.width}x${socialImageSize.height}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorefrontSocialPreviewImage({
  content,
  idea
}: StorefrontSocialPreviewImageProps) {
  const palette = content.theme.palette;
  const background = palette.background;
  const primary = palette.primary;
  const accent = palette.accent;
  const secondary = palette.secondary;
  const title = truncateForSocialImage(content.product.name, 74);
  const description = truncateForSocialImage(content.tagline, 118);
  const prompt = truncateForSocialImage(idea, 88);

  return (
    <div
      style={{
        ...baseOuterStyle,
        background: `linear-gradient(135deg, ${background} 0%, ${primary} 52%, ${secondary} 100%)`
      }}
    >
      <div
        style={{
          ...panelStyle,
          background: "rgba(8, 20, 17, 0.88)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ ...eyebrowStyle, color: accent }}>
            Generated storefront concept
          </div>
          <div style={titleStyle}>{title}</div>
          <div style={descriptionStyle}>{description}</div>
        </div>
        <div style={footerStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: accent, fontSize: 22, opacity: 0.9 }}>
              Source prompt
            </div>
            <div style={{ maxWidth: 760, opacity: 0.78 }}>{prompt}</div>
          </div>
          <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
            <div style={{ ...markStyle, color: primary }}>VS</div>
            <div>{siteName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
