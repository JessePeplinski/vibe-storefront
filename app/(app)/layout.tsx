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
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            className="inline-flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-950 sm:text-sm sm:tracking-[0.16em]"
            href="/"
          >
            <span className="flex h-9 w-9 items-center justify-center bg-slate-950 text-white">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            <span className="whitespace-nowrap">Vibe Storefront</span>
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-1 overflow-x-auto sm:gap-2">
            <Show when="signed-in">
              <Link
                className="whitespace-nowrap px-2 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950 sm:px-3"
                href="/dashboard#your-storefronts"
              >
                Your storefronts
              </Link>
              <Link
                className="whitespace-nowrap px-2 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950 sm:px-3"
                href="/storefronts"
              >
                All storefronts
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <Link
                className="whitespace-nowrap px-2 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950 sm:px-3"
                href="/storefronts"
              >
                All storefronts
              </Link>
              <AuthButtons />
            </Show>
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
