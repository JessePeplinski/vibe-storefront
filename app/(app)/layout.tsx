import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Store } from "lucide-react";
import { AuthButtons } from "@/components/auth-buttons";

export default function AppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f4f1ec]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-950 sm:text-sm sm:tracking-[0.16em]"
            href="/"
          >
            <span className="flex h-9 w-9 items-center justify-center bg-slate-950 text-white">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            <span className="whitespace-nowrap">Vibe Storefront</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950"
              href="/storefronts"
            >
              Storefronts
            </Link>
            <Show when="signed-in">
              <Link
                className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950"
                href="/dashboard"
              >
                Studio
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <AuthButtons />
            </Show>
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
