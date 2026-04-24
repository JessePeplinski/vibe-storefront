"use client";

import { useClerk } from "@clerk/nextjs";

type AuthButtonsProps = {
  variant?: "header" | "panel";
};

export function AuthButtons({ variant = "header" }: AuthButtonsProps) {
  const { openSignIn } = useClerk();

  if (variant === "panel") {
    return (
      <button
        className="inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        onClick={() => openSignIn()}
        type="button"
      >
        Sign in
      </button>
    );
  }

  return (
    <button
      className="bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
      onClick={() => openSignIn()}
      type="button"
    >
      Sign in
    </button>
  );
}
