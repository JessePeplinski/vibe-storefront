"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import type { StorefrontRecord } from "@/lib/storefront-schema";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
};

export function StorefrontStudio() {
  const [idea, setIdea] = useState("small-batch hot sauce from Brooklyn");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStorefrontResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/storefronts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idea })
      });
      const payload = (await response.json()) as
        | CreateStorefrontResponse
        | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Generation failed");
      }

      setResult(payload as CreateStorefrontResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  const previewContent = result?.storefront.content ?? sampleStorefrontContent;
  const previewIdea = result?.storefront.idea ?? idea;

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <section className="h-fit border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-slate-950 text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Generate storefront
            </h2>
            <p className="text-sm text-slate-500">
              One sentence in. A shareable page out.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Product idea
            </span>
            <textarea
              className="mt-2 min-h-32 w-full resize-none border-slate-300 text-base text-slate-950 shadow-sm focus:border-slate-950 focus:ring-slate-950"
              maxLength={220}
              minLength={6}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="small-batch hot sauce from Brooklyn"
              required
              value={idea}
            />
          </label>

          <button
            className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isGenerating}
            type="submit"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {isGenerating ? "Generating with Codex" : "Generate storefront"}
          </button>
        </form>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-bold">Storefront saved.</p>
            <Link
              className="mt-2 inline-flex items-center gap-1 font-bold underline"
              href={`/s/${result.storefront.slug}`}
            >
              Open share URL
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </section>

      <section className="min-w-0">
        <StorefrontRenderer
          content={previewContent}
          idea={previewIdea}
          publicUrl={result?.shareUrl}
        />
      </section>
    </div>
  );
}
