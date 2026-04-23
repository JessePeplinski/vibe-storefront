import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { StorefrontRecord } from "@/lib/storefront-schema";

export function StorefrontCard({ storefront }: { storefront: StorefrontRecord }) {
  return (
    <Link
      className="group block border border-black/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
      href={`/s/${storefront.slug}`}
    >
      <div
        className="mb-4 h-24 border border-black/10"
        style={{
          background: `linear-gradient(135deg, ${storefront.content.theme.palette.primary}, ${storefront.content.theme.palette.accent})`
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-950">
            {storefront.content.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {storefront.content.tagline}
          </p>
        </div>
        <ExternalLink
          className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-900"
          aria-hidden
        />
      </div>
    </Link>
  );
}
