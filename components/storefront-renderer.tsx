import type { CSSProperties } from "react";
import { ArrowRight, Quote, Sparkles } from "lucide-react";
import type { StorefrontContent } from "@/lib/storefront-schema";

type StorefrontRendererProps = {
  content: StorefrontContent;
  compact?: boolean;
  idea?: string;
  publicUrl?: string;
  variant?: "framed" | "landing";
};

type StorefrontStyle = CSSProperties & {
  "--sf-bg": string;
  "--sf-surface": string;
  "--sf-primary": string;
  "--sf-secondary": string;
  "--sf-accent": string;
  "--sf-text": string;
};

export function StorefrontRenderer({
  compact = false,
  content,
  idea,
  publicUrl,
  variant = "framed"
}: StorefrontRendererProps) {
  const isLanding = variant === "landing";
  const style: StorefrontStyle = {
    "--sf-bg": content.theme.palette.background,
    "--sf-surface": content.theme.palette.surface,
    "--sf-primary": content.theme.palette.primary,
    "--sf-secondary": content.theme.palette.secondary,
    "--sf-accent": content.theme.palette.accent,
    "--sf-text": content.theme.palette.text
  };

  return (
    <article
      className={`bg-[var(--sf-bg)] text-[var(--sf-text)] ${
        isLanding
          ? "flex min-h-screen flex-col overflow-hidden"
          : "overflow-hidden border border-black/10 shadow-glow"
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
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--sf-primary)] sm:text-sm">
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
              <p className="max-w-2xl text-lg font-bold text-[var(--sf-secondary)] sm:text-xl">
                {content.tagline}
              </p>
              <p
                className={`max-w-2xl text-base leading-7 text-black/70 ${
                  compact ? "" : "sm:text-lg"
                }`}
              >
                {content.hero.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 bg-[var(--sf-primary)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
                type="button"
              >
                {content.cta.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <span className="max-w-sm text-sm font-medium text-black/60">
                {content.cta.sublabel}
              </span>
            </div>
          </div>
          {!compact && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(content.theme.palette).map(([name, color]) => (
                <div
                  className="border border-black/10 bg-white/60 p-3 text-xs font-semibold uppercase tracking-[0.14em]"
                  key={name}
                >
                  <div
                    className="mb-3 h-10 border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  <span className="block text-black/60">{name}</span>
                  <span className="mt-1 block text-black">{color}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col justify-between gap-5 bg-[var(--sf-surface)] p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] sm:p-6">
          <div className="space-y-4">
            <div
              className={`overflow-hidden bg-[var(--sf-secondary)] text-white ${
                compact ? "aspect-[4/3] p-3" : "aspect-[4/3] p-4"
              }`}
            >
              <div
                className={`flex h-full min-w-0 flex-col justify-between border border-white/25 ${
                  compact ? "p-3" : "p-4"
                }`}
              >
                <div className="flex items-start justify-between gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                  <span className="max-w-[75%]">{content.theme.mood}</span>
                  <span>{content.product.price}</span>
                </div>
                <div>
                  <div
                    className={`mb-3 rounded-full bg-[var(--sf-accent)] ${
                      compact ? "h-9 w-9" : "h-14 w-14"
                    }`}
                  />
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
            <p className="text-base leading-7 text-black/70">
              {content.product.description}
            </p>
          </div>
          <ul className="grid gap-3">
            {content.product.highlights.map((highlight) => (
              <li
                className="border border-black/10 bg-white/70 p-3 text-sm font-semibold text-black/75"
                key={highlight}
              >
                {highlight}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {!compact && (
        <section className="grid gap-4 border-t border-black/10 bg-white/50 p-6 sm:grid-cols-3 sm:p-8">
          {content.testimonials.map((testimonial) => (
            <figure
              className="flex min-h-48 flex-col justify-between bg-[var(--sf-surface)] p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
              key={testimonial.name}
            >
              <Quote className="h-5 w-5 text-[var(--sf-primary)]" aria-hidden />
              <blockquote className="mt-4 text-sm leading-6 text-black/70">
                {`"${testimonial.quote}"`}
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="block font-bold text-black">
                  {testimonial.name}
                </span>
                <span className="text-black/55">{testimonial.role}</span>
              </figcaption>
            </figure>
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
