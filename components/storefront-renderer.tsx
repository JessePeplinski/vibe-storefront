import Image from "next/image";
import { ArrowRight, Quote, Sparkles } from "lucide-react";
import { MockCheckoutButton } from "@/components/mock-checkout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StorefrontContent } from "@/lib/storefront-schema";
import { deriveStorefrontThemeStyle } from "@/lib/storefront-theme";

type StorefrontRendererProps = {
  content: StorefrontContent;
  compact?: boolean;
  idea?: string;
  publicUrl?: string;
  variant?: "framed" | "landing";
};

export function StorefrontRenderer({
  compact = false,
  content,
  idea,
  publicUrl,
  variant = "framed"
}: StorefrontRendererProps) {
  const isLanding = variant === "landing";
  const productImage = content.product.image;
  const style = deriveStorefrontThemeStyle(content.theme.palette);

  return (
    <article
      className={`bg-[var(--sf-bg)] text-[var(--sf-text)] ${
        isLanding
          ? "flex min-h-screen flex-col overflow-hidden"
          : "overflow-hidden rounded-lg border border-black/10 shadow-glow"
      }`}
      style={style}
    >
      <section
        className={`grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] ${
          compact
            ? "lg:min-h-[430px] lg:p-9"
            : isLanding
              ? "flex-1 lg:items-center lg:p-16 xl:p-20"
              : "min-h-[520px] lg:p-12"
        }`}
      >
        <div className="flex flex-col justify-between gap-8">
          <div className={compact ? "space-y-5" : "space-y-7"}>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--sf-eyebrow)] sm:text-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span>{content.hero.eyebrow}</span>
            </div>
            <div className={compact ? "space-y-4" : "space-y-5"}>
              <h1
                className={`max-w-3xl font-black leading-[0.98] text-[var(--sf-text)] ${
                  compact ? "text-4xl sm:text-5xl" : "text-4xl sm:text-6xl"
                }`}
              >
                {content.name}
              </h1>
              <p className="max-w-2xl text-lg font-bold text-[var(--sf-support)] sm:text-xl">
                {content.tagline}
              </p>
              <p
                className={`max-w-2xl text-base leading-7 text-[var(--sf-muted)] ${
                  compact ? "" : "sm:text-lg"
                }`}
              >
                {content.hero.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isLanding ? (
                <MockCheckoutButton
                  label={content.cta.label}
                  price={content.product.price}
                  productName={content.product.name}
                />
              ) : (
                <Button
                  className="bg-[var(--sf-primary)] text-[var(--sf-on-primary)] hover:bg-[var(--sf-primary)] hover:brightness-95"
                  size="lg"
                  type="button"
                >
                  {content.cta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              )}
              <span className="max-w-sm text-sm font-medium text-[var(--sf-muted)]">
                {content.cta.sublabel}
              </span>
            </div>
          </div>
          {!compact && !isLanding && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(content.theme.palette).map(([name, color]) => (
                <Card
                  className="gap-0 rounded-md border-[var(--sf-surface-border)] bg-[var(--sf-surface-soft)] p-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-surface-text)]"
                  key={name}
                >
                  <div
                    className="mb-3 h-10 rounded-sm border border-[var(--sf-surface-border)]"
                    style={{ backgroundColor: color }}
                  />
                  <span className="block text-[var(--sf-surface-muted)]">
                    {name}
                  </span>
                  <span className="mt-1 block text-[var(--sf-surface-text)]">
                    {color}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card
          asChild
          className="flex min-w-0 flex-col justify-between gap-5 rounded-lg border-[var(--sf-surface-border)] bg-[var(--sf-surface)] p-5 py-5 text-[var(--sf-surface-text)] sm:p-6 sm:py-6"
        >
        <aside>
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden rounded-md bg-[var(--sf-secondary)] text-white ${
                compact ? "aspect-[4/3] p-3" : "aspect-[4/3] p-4"
              }`}
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
                        "linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.48))"
                    }}
                  />
                </>
              )}
              <div
                className={`relative flex h-full min-w-0 flex-col justify-between rounded-md border border-white/25 ${
                  productImage ? "bg-black/20" : ""
                } ${compact ? "p-3" : "p-4"}`}
              >
                <div className="flex items-start justify-between gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                  <span className="max-w-[75%]">{content.theme.mood}</span>
                  <span>{content.product.price}</span>
                </div>
                <div>
                  {!productImage && (
                    <div
                      className={`mb-3 rounded-full bg-[var(--sf-accent)] ${
                        compact ? "h-9 w-9" : "h-14 w-14"
                      }`}
                    />
                  )}
                  <h2
                    className={`max-w-full font-black leading-[1.02] ${
                      compact ? "text-lg" : "text-2xl sm:text-3xl"
                    }`}
                  >
                    {content.product.name}
                  </h2>
                </div>
              </div>
            </div>
            <p className="text-base leading-7 text-[var(--sf-surface-muted)]">
              {content.product.description}
            </p>
          </div>
          <ul className="grid gap-3">
            {content.product.highlights.map((highlight) => (
              <li
                className="rounded-md border border-[var(--sf-surface-border)] bg-[var(--sf-surface-soft)] p-3 text-sm font-semibold text-[var(--sf-surface-text)]"
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
        <section className="grid gap-4 border-t border-[var(--sf-border)] bg-[var(--sf-section-bg)] p-6 sm:grid-cols-3 sm:p-8">
          {content.testimonials.map((testimonial) => (
            <Card
              asChild
              className="flex min-h-48 flex-col justify-between rounded-lg border-[var(--sf-surface-border)] bg-[var(--sf-surface)] p-5 py-5 text-[var(--sf-surface-text)]"
              key={testimonial.name}
            >
            <figure>
              <Quote
                className="h-5 w-5 text-[var(--sf-surface-highlight)]"
                aria-hidden
              />
              <blockquote className="mt-4 text-sm leading-6 text-[var(--sf-surface-muted)]">
                {`"${testimonial.quote}"`}
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="block font-bold text-[var(--sf-surface-text)]">
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
        <footer className="flex flex-col gap-2 border-t border-black/10 bg-black px-6 py-4 text-xs font-semibold text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <a
            className="uppercase tracking-[0.16em] transition hover:text-white"
            href="https://vibe-storefront.com"
          >
            Built with vibe-storefront.com
          </a>
          {idea && <span>Source prompt: {idea}</span>}
        </footer>
      ) : (
        (idea || publicUrl) && (
          <footer className="flex flex-col gap-2 border-t border-black/10 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 sm:flex-row sm:items-center sm:justify-between">
            {idea && <span>Generated from: {idea}</span>}
            {publicUrl && <span>{publicUrl}</span>}
          </footer>
        )
      )}
    </article>
  );
}
