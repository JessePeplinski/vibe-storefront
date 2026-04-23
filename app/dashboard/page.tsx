import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import { StorefrontCard } from "@/components/storefront-card";
import { listStorefrontsForOwner } from "@/lib/storefronts";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const storefronts = await listStorefrontsForOwner(userId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">
            My storefronts
          </h1>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          href="/"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New storefront
        </Link>
      </div>

      {storefronts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storefronts.map((storefront) => (
            <StorefrontCard key={storefront.id} storefront={storefront} />
          ))}
        </div>
      ) : (
        <section className="border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-black text-slate-950">
            No storefronts yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Generate your first storefront from a plain-English idea, then it
            will appear here with a public share link.
          </p>
        </section>
      )}
    </main>
  );
}
