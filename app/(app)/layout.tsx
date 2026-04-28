import Link from "next/link";
import { Store } from "lucide-react";
import { AppHeaderNav } from "@/components/app-header-nav";

export default function AppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <nav className="relative mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-950 sm:text-sm sm:tracking-[0.16em]"
            href="/"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            <span className="whitespace-nowrap">Vibe Storefront</span>
          </Link>
          <AppHeaderNav />
        </nav>
      </header>
      {children}
    </>
  );
}
