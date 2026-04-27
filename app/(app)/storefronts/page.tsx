import type { Metadata } from "next";
import { clerkClient, type User } from "@clerk/nextjs/server";
import Link from "next/link";
import { CalendarDays, ExternalLink, Sparkles, UserRound } from "lucide-react";
import { StorefrontPreviewImage } from "@/components/storefront-preview-image";
import { listPublishedStorefronts } from "@/lib/storefronts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All storefronts | Vibe Storefront",
  description: "Browse every public storefront generated with Vibe Storefront."
};

const creatorFallback = "Signed-in user";

function formatCreatedDate(createdAt: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(createdAt));
}

function displayNameForUser(user: User): string {
  const parts = [user.firstName, user.lastName].flatMap((part) => {
    const trimmedPart = part?.trim();
    return trimmedPart ? [trimmedPart] : [];
  });

  return parts.join(" ") || creatorFallback;
}

async function creatorNamesByUserId(
  ownerClerkUserIds: string[]
): Promise<Map<string, string>> {
  const uniqueOwnerIds = Array.from(new Set(ownerClerkUserIds));

  if (uniqueOwnerIds.length === 0) {
    return new Map();
  }

  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: uniqueOwnerIds.length,
      userId: uniqueOwnerIds
    });

    return new Map(
      response.data.map((user) => [user.id, displayNameForUser(user)])
    );
  } catch {
    return new Map();
  }
}

export default async function AllStorefrontsPage() {
  const storefronts = await listPublishedStorefronts();
  const creatorNames = await creatorNamesByUserId(
    storefronts.flatMap((storefront) =>
      storefront.owner_clerk_user_id ? [storefront.owner_clerk_user_id] : []
    )
  );

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              All storefronts
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Browse every public storefront generated across Vibe Storefront.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            href="/"
          >
            Generate storefront
            <Sparkles className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {storefronts.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {storefronts.map((storefront) => {
              const creatorLabel = storefront.owner_clerk_user_id
                ? (creatorNames.get(storefront.owner_clerk_user_id) ??
                  creatorFallback)
                : "guest";
              const storefrontHref = `/s/${storefront.slug}`;

              return (
                <article
                  className="border border-black/10 bg-white p-4 shadow-sm"
                  key={storefront.id}
                >
                  <StorefrontPreviewImage
                    className="mb-4 h-24"
                    content={storefront.content}
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-slate-950">
                      {storefront.content.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {storefront.content.tagline}
                    </p>
                    <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                      <p className="inline-flex items-center gap-2">
                        <UserRound
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        <span>By {creatorLabel}</span>
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        <span>Created {formatCreatedDate(storefront.created_at)}</span>
                      </p>
                    </div>
                    <p className="mt-4 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      From: {storefront.idea}
                    </p>
                  </div>
                  <Link
                    className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-slate-900 bg-slate-950 px-3 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                    href={storefrontHref}
                  >
                    Open storefront
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-2xl font-black text-slate-950">
              No storefronts yet.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Public storefronts will appear here after the first generation.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
