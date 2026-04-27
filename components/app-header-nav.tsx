"use client";

import { useEffect, useState } from "react";
import { Show, useClerk, useUser, UserButton } from "@clerk/nextjs";
import { ChevronRight, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";

const menuId = "signed-in-navigation-menu";
const githubRepoUrl = "https://github.com/JessePeplinski/vibe-storefront";

function GitHubMark() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function AppHeaderNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const emailAddress = user?.primaryEmailAddress?.emailAddress;
  const accountLabel =
    user?.fullName || user?.username || emailAddress || "Account settings";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="flex min-w-0 items-center justify-end gap-2">
      <Show when="signed-in">
        <button
          aria-controls={menuId}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-slate-950 shadow-sm transition hover:bg-slate-100 sm:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
        <div
          className={`${
            isOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-full z-10 flex-col gap-1 border-b border-black/10 bg-[#f4f1ec] px-4 py-3 shadow-lg sm:static sm:z-auto sm:flex sm:flex-row sm:items-center sm:justify-end sm:gap-1 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
          id={menuId}
        >
          <Link
            className="whitespace-nowrap px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-white/70 hover:text-slate-950 sm:px-3 sm:py-2 sm:hover:bg-transparent"
            href="/dashboard#your-storefronts"
            onClick={() => setIsOpen(false)}
          >
            Your storefronts
          </Link>
          <Link
            className="whitespace-nowrap px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-white/70 hover:text-slate-950 sm:px-3 sm:py-2 sm:hover:bg-transparent"
            href="/storefronts"
            onClick={() => setIsOpen(false)}
          >
            All storefronts
          </Link>
          <a
            aria-label="GitHub"
            className="inline-flex h-11 w-11 items-center justify-center text-slate-700 transition hover:bg-white/70 hover:text-slate-950 sm:h-10 sm:w-10 sm:hover:bg-transparent"
            href={githubRepoUrl}
            onClick={() => setIsOpen(false)}
            rel="noreferrer"
            target="_blank"
            title="GitHub"
          >
            <GitHubMark />
          </a>
          <div className="mt-2 grid gap-2 sm:hidden">
            <button
              aria-label="Manage account"
              className="flex w-full items-center justify-between gap-3 bg-white/70 px-3 py-3 text-left text-slate-950 transition hover:bg-white"
              onClick={() => {
                setIsOpen(false);
                openUserProfile();
              }}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 bg-cover bg-center text-white"
                  style={
                    user?.imageUrl
                      ? { backgroundImage: `url(${user.imageUrl})` }
                      : undefined
                  }
                >
                  {!user?.imageUrl ? (
                    <UserRound className="h-4 w-4" aria-hidden />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">
                    Manage account
                  </span>
                  <span className="block truncate text-xs font-bold text-slate-500">
                    {accountLabel}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
            <button
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-white/70 hover:text-slate-950"
              onClick={() => {
                setIsOpen(false);
                void signOut({ redirectUrl: "/" });
              }}
              type="button"
            >
              <span className="flex items-center gap-3">
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </span>
            </button>
          </div>
          <div className="hidden sm:block">
            <UserButton />
          </div>
        </div>
      </Show>
      <Show when="signed-out">
        <Link
          className="whitespace-nowrap px-2 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950 sm:px-3"
          href="/storefronts"
        >
          All storefronts
        </Link>
        <a
          aria-label="GitHub"
          className="inline-flex h-10 w-10 items-center justify-center text-slate-700 transition hover:text-slate-950"
          href={githubRepoUrl}
          rel="noreferrer"
          target="_blank"
          title="GitHub"
        >
          <GitHubMark />
        </a>
        <AuthButtons />
      </Show>
    </div>
  );
}
