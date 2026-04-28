import type { CSSProperties } from "react";
import {
  defaultStorefrontThemeAppearance,
  type StorefrontContent,
  type StorefrontThemeAppearance
} from "@/lib/storefront-schema";

type StorefrontPalette = StorefrontContent["theme"]["palette"];

type Rgb = {
  b: number;
  g: number;
  r: number;
};

export type StorefrontThemeStyle = CSSProperties & {
  "--accent": string;
  "--accent-foreground": string;
  "--background": string;
  "--border": string;
  "--card": string;
  "--card-foreground": string;
  "--destructive": string;
  "--foreground": string;
  "--input": string;
  "--muted": string;
  "--muted-foreground": string;
  "--popover": string;
  "--popover-foreground": string;
  "--primary": string;
  "--primary-foreground": string;
  "--radius": string;
  "--ring": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--sf-accent": string;
  "--sf-bg": string;
  "--sf-border": string;
  "--sf-eyebrow": string;
  "--sf-muted": string;
  "--sf-on-primary": string;
  "--sf-primary": string;
  "--sf-secondary": string;
  "--sf-section-bg": string;
  "--sf-surface": string;
  "--sf-surface-border": string;
  "--sf-surface-highlight": string;
  "--sf-surface-muted": string;
  "--sf-surface-soft": string;
  "--sf-surface-text": string;
  "--sf-support": string;
  "--sf-text": string;
};

const DARK_TEXT = "#0f172a";
const LIGHT_TEXT = "#f8fafc";
const DESTRUCTIVE = "#b91c1c";
const MIN_TEXT_CONTRAST = 4.5;

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function toHexComponent(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex({ b, g, r }: Rgb): string {
  return `#${toHexComponent(r)}${toHexComponent(g)}${toHexComponent(b)}`;
}

function blendColors(foreground: string, background: string, alpha: number): string {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  return rgbToHex({
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha)
  });
}

function channelToLinear(value: number): number {
  const normalized = value / 255;

  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const { b, g, r } = hexToRgb(hex);

  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function strongestReadableText(background: string): string {
  return getContrastRatio(DARK_TEXT, background) >
    getContrastRatio(LIGHT_TEXT, background)
    ? DARK_TEXT
    : LIGHT_TEXT;
}

function readableColor({
  background,
  candidates,
  minContrast = MIN_TEXT_CONTRAST
}: {
  background: string;
  candidates: string[];
  minContrast?: number;
}): string {
  return (
    candidates.find(
      (candidate) => getContrastRatio(candidate, background) >= minContrast
    ) ?? strongestReadableText(background)
  );
}

function mutedReadableColor(text: string, background: string): string {
  for (const alpha of [0.72, 0.8, 0.88, 0.96, 1]) {
    const muted = blendColors(text, background, alpha);

    if (getContrastRatio(muted, background) >= MIN_TEXT_CONTRAST) {
      return muted;
    }
  }

  return text;
}

function radiusForAppearance(radius: StorefrontThemeAppearance["radius"]): string {
  if (radius === "sharp") {
    return "0.125rem";
  }

  if (radius === "soft") {
    return "0.5rem";
  }

  return "0.375rem";
}

export function deriveStorefrontThemeStyle(
  palette: StorefrontPalette,
  appearance: StorefrontThemeAppearance = defaultStorefrontThemeAppearance
): StorefrontThemeStyle {
  const pageText = readableColor({
    background: palette.background,
    candidates: [palette.text]
  });
  const surfaceText = readableColor({
    background: palette.surface,
    candidates: [palette.text]
  });
  const pageBorder = blendColors(pageText, palette.background, 0.16);
  const pageMuted = mutedReadableColor(pageText, palette.background);
  const surfaceBorder = blendColors(surfaceText, palette.surface, 0.14);
  const surfaceMuted = mutedReadableColor(surfaceText, palette.surface);
  const primaryForeground = strongestReadableText(palette.primary);
  const secondaryForeground = strongestReadableText(palette.secondary);
  const accentForeground = strongestReadableText(palette.accent);

  return {
    "--accent": palette.accent,
    "--accent-foreground": accentForeground,
    "--background": palette.background,
    "--border": pageBorder,
    "--card": palette.surface,
    "--card-foreground": surfaceText,
    "--destructive": DESTRUCTIVE,
    "--foreground": pageText,
    "--input": pageBorder,
    "--muted": blendColors(pageText, palette.background, 0.08),
    "--muted-foreground": pageMuted,
    "--popover": palette.surface,
    "--popover-foreground": surfaceText,
    "--primary": palette.primary,
    "--primary-foreground": primaryForeground,
    "--radius": radiusForAppearance(appearance.radius),
    "--ring": readableColor({
      background: palette.background,
      candidates: [palette.primary, palette.secondary, palette.accent]
    }),
    "--secondary": palette.secondary,
    "--secondary-foreground": secondaryForeground,
    "--sf-accent": palette.accent,
    "--sf-bg": palette.background,
    "--sf-border": pageBorder,
    "--sf-eyebrow": readableColor({
      background: palette.background,
      candidates: [palette.primary, palette.secondary, palette.accent]
    }),
    "--sf-muted": pageMuted,
    "--sf-on-primary": primaryForeground,
    "--sf-primary": palette.primary,
    "--sf-secondary": palette.secondary,
    "--sf-section-bg": blendColors(palette.surface, palette.background, 0.76),
    "--sf-surface": palette.surface,
    "--sf-surface-border": surfaceBorder,
    "--sf-surface-highlight": readableColor({
      background: palette.surface,
      candidates: [palette.primary, palette.secondary, palette.accent]
    }),
    "--sf-surface-muted": surfaceMuted,
    "--sf-surface-soft": blendColors(surfaceText, palette.surface, 0.04),
    "--sf-surface-text": surfaceText,
    "--sf-support": readableColor({
      background: palette.background,
      candidates: [palette.secondary, palette.primary, palette.accent]
    }),
    "--sf-text": pageText
  };
}
