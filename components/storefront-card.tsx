"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  ReceiptText,
  Trash2
} from "lucide-react";
import { StorefrontPreviewImage } from "@/components/storefront-preview-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StorefrontRecord } from "@/lib/storefront-schema";
import { formatUsageUsd } from "@/lib/usage-format";

type StorefrontCardProps = {
  storefront: StorefrontRecord;
  deleteDisabled?: boolean;
  isDeleting?: boolean;
  onDelete?: (storefront: StorefrontRecord) => void;
};

export function StorefrontCard({
  deleteDisabled = false,
  isDeleting = false,
  onDelete,
  storefront
}: StorefrontCardProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const canDelete = Boolean(onDelete);
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
    <Card
      asChild
      className="grid gap-4 p-4 transition sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center"
    >
    <article>
      <StorefrontPreviewImage
        className="h-16 w-full rounded-md sm:w-[88px]"
        content={storefront.content}
        sizes="(min-width: 640px) 88px, 100vw"
      />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black leading-tight text-slate-950">
          {storefront.content.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-slate-600">
          {storefront.content.tagline}
        </p>
        <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500">
          From: {storefront.idea}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Created {createdDate}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <ReceiptText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {storefront.generation_cost
            ? `Estimated cost ${formatUsageUsd(storefront.generation_cost.totalUsd)}`
            : "Estimated cost not recorded"}
        </p>
      </div>
      <div
        className={
          canDelete
            ? "grid grid-cols-3 gap-2 sm:w-[230px]"
            : "grid grid-cols-2 gap-2 sm:w-[150px]"
        }
      >
        <Button
          aria-label={`Copy live link for ${storefront.content.name}`}
          className="h-11 px-2 text-xs sm:h-10"
          onClick={() => void handleCopyLink()}
          size="sm"
          type="button"
          variant="outline"
        >
          {hasCopied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {hasCopied ? "Copied" : "Copy"}
        </Button>
        <Button asChild className="h-11 px-2 text-xs sm:h-10" size="sm">
          <Link
            aria-label={`Open live storefront for ${storefront.content.name}`}
            href={liveHref}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Live
          </Link>
        </Button>
        {canDelete && (
          <Button
            aria-label={`Delete storefront ${storefront.content.name}`}
            className="h-11 px-2 text-xs sm:h-10"
            disabled={deleteDisabled}
            onClick={() => onDelete?.(storefront)}
            size="sm"
            type="button"
            variant="destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {isDeleting ? "Deleting" : "Delete"}
          </Button>
        )}
      </div>
    </article>
    </Card>
  );
}
