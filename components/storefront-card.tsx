"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Eye, Pencil } from "lucide-react";
import type { StorefrontRecord } from "@/lib/storefront-schema";

type StorefrontCardProps = {
  isSelected: boolean;
  onPreview: (storefront: StorefrontRecord) => void;
  storefront: StorefrontRecord;
};

export function StorefrontCard({
  isSelected,
  onPreview,
  storefront
}: StorefrontCardProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const liveHref = `/s/${storefront.slug}`;
  const createdDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(storefront.created_at));

  async function handleCopyLink() {
    await window.navigator.clipboard.writeText(
      `${window.location.origin}${liveHref}`
    );
    setHasCopied(true);
  }

  return (
    <article
      className={`border bg-white p-4 transition ${
        isSelected ? "border-teal-300 shadow-lg" : "border-black/10"
      }`}
    >
      <div
        className="mb-4 h-24 border border-black/10"
        style={{
          background: `linear-gradient(135deg, ${storefront.content.theme.palette.primary}, ${storefront.content.theme.palette.accent})`
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-950">
            {storefront.content.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {storefront.content.tagline}
          </p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Created {createdDate}
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
            From: {storefront.idea}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          aria-label={`Preview ${storefront.content.name}`}
          aria-pressed={isSelected}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-slate-900 bg-slate-950 px-2 text-xs font-black text-white transition hover:bg-slate-800"
          onClick={() => onPreview(storefront)}
          type="button"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Preview
        </button>
        <button
          aria-label={`Copy live link for ${storefront.content.name}`}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-black/10 bg-white px-2 text-xs font-black text-slate-950 transition hover:bg-stone-100"
          onClick={() => void handleCopyLink()}
          type="button"
        >
          {hasCopied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {hasCopied ? "Copied" : "Copy"}
        </button>
        <Link
          aria-label={`Open live storefront for ${storefront.content.name}`}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-black/10 bg-white px-2 text-xs font-black text-slate-950 transition hover:bg-stone-100"
          href={liveHref}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Live
        </Link>
        <button
          aria-label={`Edit ${storefront.content.name}`}
          className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-1.5 border border-black/10 bg-stone-100 px-2 text-xs font-black text-stone-400"
          disabled
          title="Editing coming soon"
          type="button"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </button>
      </div>
    </article>
  );
}
