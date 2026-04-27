import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Globe2,
  Layers3,
  WandSparkles
} from "lucide-react";
import { LandingIdeaTeaser } from "@/components/landing-idea-teaser";
import { StorefrontPreviewImage } from "@/components/storefront-preview-image";
import { listPublishedStorefronts } from "@/lib/storefronts";
import type { StorefrontRecord } from "@/lib/storefront-schema";

export const metadata: Metadata = {
  title: "Vibe Storefront | Validate product ideas fast",
  description:
    "Turn a raw product idea into a shareable storefront concept for fast market validation."
};

const validationSteps = [
  {
    description:
      "Start with the product, buyer, or problem you want to test. No design brief required.",
    icon: WandSparkles,
    title: "Describe the idea"
  },
  {
    description:
      "Get a brand name, positioning, product page, CTA, palette, reviews, and product imagery.",
    icon: Layers3,
    title: "Generate the market story"
  },
  {
    description:
      "Send the public URL to customers, friends, or investors and see whether the offer lands.",
    icon: Globe2,
    title: "Share the storefront"
  }
] as const;

function cssImageUrl(url: string): string {
  return `url("${url.replace(/"/g, '\\"')}")`;
}

function heroBackground(storefronts: StorefrontRecord[]): string {
  const image = storefronts.find(
    (storefront) => storefront.content.product.image
  )?.content.product.image;

  if (!image) {
    return "linear-gradient(135deg, #061f18, #143d32 54%, #0b1724)";
  }

  return `linear-gradient(90deg, rgba(5, 24, 18, 0.94), rgba(5, 24, 18, 0.74) 54%, rgba(5, 24, 18, 0.52)), ${cssImageUrl(
    image.url
  )}`;
}

function ExampleStorefronts({
  storefronts
}: {
  storefronts: StorefrontRecord[];
}) {
  if (storefronts.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-[#f8f7f2] p-8 text-center">
        <h3 className="text-2xl font-black text-slate-950">
          Live examples will appear here.
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          The gallery fills with public storefronts as product ideas are
          generated and shared.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {storefronts.map((storefront) => (
        <article
          className="flex min-h-full flex-col border border-black/10 bg-white p-3 shadow-sm"
          key={storefront.id}
        >
          <StorefrontPreviewImage
            className="h-44"
            content={storefront.content}
          />
          <div className="flex flex-1 flex-col p-2 pt-4">
            <h3 className="text-2xl font-black leading-tight text-slate-950">
              {storefront.content.name}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {storefront.content.tagline}
            </p>
            <p className="mt-4 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
              From: {storefront.idea}
            </p>
            <Link
              className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              href={`/s/${storefront.slug}`}
            >
              Open storefront
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  const exampleStorefronts = await listPublishedStorefronts(3);

  return (
    <main className="overflow-hidden bg-[#f8f7f2]">
      <section className="relative isolate overflow-hidden bg-[#08251d] text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: heroBackground(exampleStorefronts) }}
          />
          <div className="absolute inset-0 bg-[#071b15]/42" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-14">
          <div className="pt-2 sm:pt-4">
            <h1 className="max-w-none text-4xl font-black leading-[0.94] text-white sm:text-6xl lg:text-[5rem] xl:text-[5.4rem]">
              Validate product ideas
              <br className="hidden sm:block" /> with a storefront.
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-7 text-white/80 sm:text-xl sm:leading-8">
              Turn a raw product concept into a basic landing page powered by
              Codex 5.3 and Image API 2.
            </p>
          </div>

          <div className="mt-6 max-w-5xl" id="generate">
            <LandingIdeaTeaser />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              Fast signal
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Find out if the story is clear before the roadmap gets expensive.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              A real buyer does not grade your idea doc. They react to the
              promise, product, price, and page. Vibe Storefront gives you that
              first sellable version quickly enough to compare ideas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:pt-2">
            {validationSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  className="border border-black/10 bg-white p-5 shadow-sm"
                  key={step.title}
                >
                  <div className="flex h-11 w-11 items-center justify-center bg-[#083f31] text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="examples-title"
        className="bg-white px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                <BarChart3 className="h-4 w-4" aria-hidden />
                Live output
              </p>
              <h2
                className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl"
                id="examples-title"
              >
                See what product ideas become.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                These are the latest public storefronts generated from real
                prompts in the app.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-950 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-950 hover:text-white"
              href="/storefronts"
            >
              Browse gallery
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ExampleStorefronts storefronts={exampleStorefronts} />
        </div>
      </section>

      <section className="bg-[#08251d] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              Build the first signal
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Start with the product idea you are already debating.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#8ee8b6] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#b8f3cf]"
              href="#generate"
            >
              Validate an idea
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
              href="/storefronts"
            >
              See examples
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
