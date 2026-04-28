import { describe, expect, it } from "vitest";
import {
  deriveStorefrontThemeStyle,
  getContrastRatio
} from "@/lib/storefront-theme";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

describe("deriveStorefrontThemeStyle", () => {
  it("repairs matching dark background and text colors", () => {
    const palette = {
      background: "#111827",
      surface: "#F9FAFB",
      primary: "#B91C1C",
      secondary: "#1D4ED8",
      accent: "#F59E0B",
      text: "#111827"
    };
    const style = deriveStorefrontThemeStyle(palette);

    expect(style["--sf-text"]).toBe("#f8fafc");
    expect(style["--background"]).toBe(palette.background);
    expect(style["--foreground"]).toBe("#f8fafc");
    expect(style["--card"]).toBe(palette.surface);
    expect(style["--card-foreground"]).toBe("#111827");
    expect(style["--sf-support"]).toBe("#F59E0B");
    expect(style["--sf-surface-text"]).toBe("#111827");
    expect(
      getContrastRatio(style["--sf-text"], palette.background)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(style["--sf-muted"], palette.background)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(style["--sf-support"], palette.background)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back when generated emphasis colors are too faint", () => {
    const palette = {
      background: "#ffffff",
      surface: "#ffffff",
      primary: "#f1f5f9",
      secondary: "#e2e8f0",
      accent: "#0f172a",
      text: "#f8fafc"
    };
    const style = deriveStorefrontThemeStyle(palette);

    expect(style["--sf-text"]).toBe("#0f172a");
    expect(style["--sf-support"]).toBe("#0f172a");
    expect(
      getContrastRatio(style["--sf-support"], palette.background)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps readable colors from a good light palette", () => {
    const palette = sampleStorefrontContent.theme.palette;
    const style = deriveStorefrontThemeStyle(
      palette,
      sampleStorefrontContent.theme.appearance
    );

    expect(style["--sf-text"]).toBe(palette.text);
    expect(style["--background"]).toBe(palette.background);
    expect(style["--foreground"]).toBe(palette.text);
    expect(style["--primary"]).toBe(palette.primary);
    expect(style["--primary-foreground"]).toBe("#f8fafc");
    expect(style["--radius"]).toBe("0.375rem");
    expect(style["--sf-eyebrow"]).toBe(palette.primary);
    expect(style["--sf-support"]).toBe(palette.secondary);
    expect(style["--sf-surface-text"]).toBe(palette.text);
  });

  it("chooses dark button text for light primary colors", () => {
    const palette = {
      ...sampleStorefrontContent.theme.palette,
      primary: "#FDE68A"
    };
    const style = deriveStorefrontThemeStyle(palette);

    expect(style["--sf-on-primary"]).toBe("#0f172a");
    expect(style["--primary-foreground"]).toBe("#0f172a");
    expect(
      getContrastRatio(style["--sf-on-primary"], palette.primary)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("maps appearance radius to a scoped shadcn radius token", () => {
    const palette = sampleStorefrontContent.theme.palette;

    expect(
      deriveStorefrontThemeStyle(palette, {
        radius: "sharp",
        surface: "solid",
        treatment: "minimal"
      })["--radius"]
    ).toBe("0.125rem");
    expect(
      deriveStorefrontThemeStyle(palette, {
        radius: "soft",
        surface: "solid",
        treatment: "minimal"
      })["--radius"]
    ).toBe("0.5rem");
  });
});
