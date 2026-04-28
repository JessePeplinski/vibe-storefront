"use client";

import Image from "next/image";
import { ArrowRight, Quote, Sparkles, Store } from "lucide-react";
import {
  MockCheckoutDialogContent,
  MockCheckoutTriggerButton
} from "@/components/mock-checkout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type {
  StorefrontContent,
  StorefrontThemeAppearance
} from "@/lib/storefront-schema";
import { deriveStorefrontThemeStyle } from "@/lib/storefront-theme";
import { cn } from "@/lib/utils";

type StorefrontRendererProps = {
  content: StorefrontContent;
  compact?: boolean;
  idea?: string;
  publicUrl?: string;
  variant?: "framed" | "landing";
};

type TreatmentClassNames = {
  eyebrow: string;
  heroGrid: string;
  media: string;
  productCard: string;
  testimonial: string;
};

type SurfaceClassNames = {
  card: string;
  inset: string;
  media: string;
};

const treatmentClassNames: Record<
  StorefrontThemeAppearance["treatment"],
  TreatmentClassNames
> = {
  bold: {
    eyebrow: "font-black",
    heroGrid: "lg:grid-cols-[1.12fr_0.88fr]",
    media: "shadow-lg",
    productCard: "shadow-lg",
    testimonial: "shadow-md"
  },
  editorial: {
    eyebrow: "font-bold",
    heroGrid: "lg:grid-cols-[0.94fr_1.06fr]",
    media: "shadow-md",
    productCard: "shadow-md",
    testimonial: "shadow-sm"
  },
  minimal: {
    eyebrow: "font-bold",
    heroGrid: "lg:grid-cols-[1.02fr_0.98fr]",
    media: "shadow-sm",
    productCard: "shadow-sm",
    testimonial: "shadow-sm"
  },
  playful: {
    eyebrow: "font-black",
    heroGrid: "lg:grid-cols-[1fr_1fr]",
    media: "shadow-lg",
    productCard: "shadow-md",
    testimonial: "shadow-md"
  },
  premium: {
    eyebrow: "font-bold",
    heroGrid: "lg:grid-cols-[0.98fr_1.02fr]",
    media: "shadow-lg",
    productCard: "shadow-lg",
    testimonial: "shadow-md"
  },
  technical: {
    eyebrow: "font-bold",
    heroGrid: "lg:grid-cols-[1.08fr_0.92fr]",
    media: "shadow-sm",
    productCard: "shadow-sm",
    testimonial: "shadow-sm"
  }
};

const surfaceClassNames: Record<
  StorefrontThemeAppearance["surface"],
  SurfaceClassNames
> = {
  outlined: {
    card: "border-2 bg-background",
    inset: "border bg-background",
    media: "border-2 bg-background"
  },
  solid: {
    card: "bg-card",
    inset: "bg-muted/55",
    media: "bg-secondary"
  },
  tinted: {
    card: "bg-card/90 backdrop-blur",
    inset: "bg-muted/70",
    media: "bg-secondary/90"
  }
};

function StorefrontNav({ productName }: { productName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 break-words text-sm font-black leading-tight text-foreground [overflow-wrap:anywhere] sm:text-base">
            {productName}
          </span>
        </div>
        <DialogTrigger asChild>
          <MockCheckoutTriggerButton
            className="min-h-10 whitespace-nowrap px-4"
            label="Buy now"
            size="sm"
          />
        </DialogTrigger>
      </nav>
    </header>
  );
}

export function StorefrontRenderer({
  compact = false,
  content,
  idea,
  publicUrl,
  variant = "framed"
}: StorefrontRendererProps) {
  const isLanding = variant === "landing";
  const productImage = content.product.image;
  const appearance = content.theme.appearance;
  const treatmentClasses = treatmentClassNames[appearance.treatment];
  const surfaceClasses = surfaceClassNames[appearance.surface];
  const style = deriveStorefrontThemeStyle(content.theme.palette, appearance);

  const article = (
    <article
      className={cn(
        "bg-background text-foreground",
        isLanding
          ? "flex min-h-screen flex-col overflow-hidden"
          : "overflow-hidden rounded-lg border border-border shadow-glow"
      )}
      style={style}
    >
      {isLanding && <StorefrontNav productName={content.product.name} />}

      <section
        className={cn(
          "grid gap-7 p-6 sm:p-8",
          treatmentClasses.heroGrid,
          compact
            ? "lg:min-h-[430px] lg:p-9"
            : isLanding
              ? "flex-1 lg:items-center lg:p-16 xl:p-20"
              : "min-h-[520px] lg:p-12"
        )}
      >
        <div className="flex min-w-0 flex-col justify-between gap-8">
          <div className={compact ? "space-y-5" : "space-y-7"}>
            <div
              className={cn(
                "flex items-center gap-3 break-words text-xs text-[var(--sf-eyebrow)] [overflow-wrap:anywhere] sm:text-sm",
                treatmentClasses.eyebrow
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              <span>{content.hero.eyebrow}</span>
            </div>
            <div className={compact ? "space-y-4" : "space-y-5"}>
              <h1
                className={cn(
                  "max-w-3xl break-words font-black leading-none text-balance text-foreground [overflow-wrap:anywhere]",
                  compact ? "text-4xl sm:text-5xl" : "text-4xl sm:text-6xl"
                )}
              >
                {content.product.name}
              </h1>
              <p className="max-w-2xl break-words text-lg font-bold leading-8 text-[var(--sf-support)] [overflow-wrap:anywhere] sm:text-xl">
                {content.tagline}
              </p>
              <p
                className={cn(
                  "max-w-2xl break-words text-base leading-7 text-[var(--sf-muted)] [overflow-wrap:anywhere]",
                  compact ? "" : "sm:text-lg"
                )}
              >
                {content.hero.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isLanding ? (
                <DialogTrigger asChild>
                  <MockCheckoutTriggerButton
                    className="whitespace-normal text-center"
                    label={content.cta.label}
                    size="lg"
                  />
                </DialogTrigger>
              ) : (
                <Button size="lg" type="button">
                  {content.cta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              )}
              <span className="max-w-sm break-words text-sm font-medium leading-6 text-[var(--sf-muted)] [overflow-wrap:anywhere]">
                {content.cta.sublabel}
              </span>
            </div>
          </div>
          {!compact && !isLanding && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(content.theme.palette).map(([name, color]) => (
                <Card
                  className="gap-0 rounded-md border-border bg-card p-3 text-xs font-semibold text-card-foreground"
                  key={name}
                >
                  <div
                    className="mb-3 h-10 rounded-sm border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="block text-muted-foreground">{name}</span>
                  <span className="mt-1 block break-words [overflow-wrap:anywhere]">
                    {color}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card
          asChild
          className={cn(
            "flex min-w-0 flex-col justify-between gap-5 rounded-lg border-border p-5 text-card-foreground sm:p-6",
            surfaceClasses.card,
            treatmentClasses.productCard
          )}
        >
          <aside>
            <div className="space-y-4">
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg text-secondary-foreground",
                  surfaceClasses.media,
                  treatmentClasses.media,
                  productImage ? "text-white" : "",
                  compact ? "aspect-[4/3] p-3" : "aspect-[4/3] p-4"
                )}
              >
                {productImage && (
                  <>
                    <Image
                      alt={productImage.alt}
                      className="object-cover"
                      fill
                      preload={isLanding}
                      sizes={
                        compact
                          ? "(min-width: 1024px) 360px, 100vw"
                          : "(min-width: 1024px) 48vw, 100vw"
                      }
                      src={productImage.url}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, rgba(0,0,0,0.14), rgba(0,0,0,0.56))"
                      }}
                    />
                  </>
                )}
                <div
                  className={cn(
                    "relative flex h-full min-w-0 flex-col justify-between rounded-md border border-current/30",
                    productImage ? "bg-black/20" : "",
                    compact ? "p-3" : "p-4"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 break-words text-xs font-bold leading-5 [overflow-wrap:anywhere]">
                    <span className="max-w-[72%]">{content.theme.mood}</span>
                    <span className="shrink-0">{content.product.price}</span>
                  </div>
                  <div>
                    {!productImage && (
                      <div
                        className={cn(
                          "mb-3 rounded-full bg-accent",
                          compact ? "size-9" : "size-14"
                        )}
                      />
                    )}
                    <h2
                      className={cn(
                        "max-w-full break-words font-black leading-tight text-balance [overflow-wrap:anywhere]",
                        compact ? "text-lg" : "text-2xl sm:text-3xl"
                      )}
                    >
                      {content.product.name}
                    </h2>
                  </div>
                </div>
              </div>
              <p className="break-words text-base leading-7 text-[var(--sf-surface-muted)] [overflow-wrap:anywhere]">
                {content.product.description}
              </p>
            </div>
            <ul className="grid gap-3">
              {content.product.highlights.map((highlight) => (
                <li
                  className={cn(
                    "rounded-md border border-border p-3 text-sm font-semibold leading-6 text-card-foreground",
                    "break-words [overflow-wrap:anywhere]",
                    surfaceClasses.inset
                  )}
                  key={highlight}
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </aside>
        </Card>
      </section>

      {!compact && (
        <section className="grid gap-4 border-t border-border bg-muted/45 p-6 sm:grid-cols-3 sm:p-8">
          {content.testimonials.map((testimonial) => (
            <Card
              asChild
              className={cn(
                "flex min-h-48 flex-col justify-between rounded-lg border-border bg-card p-5 text-card-foreground",
                treatmentClasses.testimonial
              )}
              key={testimonial.name}
            >
              <figure>
                <Quote className="h-5 w-5 text-accent" aria-hidden />
                <blockquote className="mt-4 break-words text-sm leading-6 text-[var(--sf-surface-muted)] [overflow-wrap:anywhere]">
                  {`"${testimonial.quote}"`}
                </blockquote>
                <figcaption className="mt-6 break-words text-sm [overflow-wrap:anywhere]">
                  <span className="block font-bold text-card-foreground">
                    {testimonial.name}
                  </span>
                  <span className="text-[var(--sf-surface-muted)]">
                    {testimonial.role}
                  </span>
                </figcaption>
              </figure>
            </Card>
          ))}
        </section>
      )}

      {isLanding ? (
        <footer className="flex flex-col gap-3 border-t border-border bg-foreground px-6 py-4 text-xs font-semibold text-background sm:flex-row sm:items-center sm:justify-between">
          <a
            className="inline-flex min-h-11 items-center transition hover:opacity-80"
            href="https://vibe-storefront.com"
          >
            Built with vibe-storefront.com
          </a>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {idea && (
              <span className="break-words [overflow-wrap:anywhere]">
                Source prompt: {idea}
              </span>
            )}
          </div>
        </footer>
      ) : (
        (idea || publicUrl) && (
          <footer className="flex flex-col gap-2 border-t border-border bg-foreground px-6 py-4 text-xs font-semibold text-background sm:flex-row sm:items-center sm:justify-between">
            {idea && (
              <span className="break-words [overflow-wrap:anywhere]">
                Generated from: {idea}
              </span>
            )}
            {publicUrl && (
              <span className="break-words [overflow-wrap:anywhere]">
                {publicUrl}
              </span>
            )}
          </footer>
        )
      )}
    </article>
  );

  if (!isLanding) {
    return article;
  }

  return (
    <Dialog>
      {article}
      <MockCheckoutDialogContent
        price={content.product.price}
        productName={content.product.name}
      />
    </Dialog>
  );
}
