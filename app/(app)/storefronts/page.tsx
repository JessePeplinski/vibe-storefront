import type { Metadata } from "next";
import { clerkClient, type User } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  ReceiptText,
  Sparkles,
  UserRound
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { StorefrontPreviewImage } from "@/components/storefront-preview-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";
import { listPublishedStorefronts } from "@/lib/storefronts";
import { formatUsageUsd } from "@/lib/usage-format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  description: "Browse every public storefront generated with Vibe Storefront.",
  path: "/storefronts",
  title: "All storefronts | Vibe Storefront"
});

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
    <>
      <JsonLd data={collectionPageJsonLd(storefronts)} />
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
          <Button asChild size="lg">
            <Link href="/">
              Generate storefront
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
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
                <Card
                  asChild
                  className="gap-0 p-4"
                  key={storefront.id}
                >
                <article>
                  <StorefrontPreviewImage
                    className="mb-4 h-24 rounded-md"
                    content={storefront.content}
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-slate-950">
                      {storefront.content.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {storefront.content.tagline}
                    </p>
                    <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                      <p className="flex items-center gap-2">
                        <UserRound
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        <span>By {creatorLabel}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        <span>Created {formatCreatedDate(storefront.created_at)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <ReceiptText
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        {storefront.generation_cost ? (
                          <span>
                            Estimated cost{" "}
                            {formatUsageUsd(storefront.generation_cost.totalUsd)}
                          </span>
                        ) : (
                          <span>Estimated cost not recorded</span>
                        )}
                      </p>
                    </div>
                    <Badge className="mt-4 max-w-full" variant="secondary">
                      Public
                    </Badge>
                    <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      Source prompt: {storefront.idea}
                    </p>
                  </div>
                  <Button asChild className="mt-5 w-full">
                    <Link href={storefrontHref}>
                      Open storefront
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </article>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-8 border-dashed p-8 text-center">
            <h2 className="text-2xl font-black text-slate-950">
              No storefronts yet.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Public storefronts will appear here after the first generation.
            </p>
          </Card>
        )}
        </section>
      </main>
    </>
  );
}
