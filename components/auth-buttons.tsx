"use client";

import { useClerk } from "@clerk/nextjs";

type AuthButtonsProps = {
  variant?: "header" | "panel";
};

export function AuthButtons({ variant = "header" }: AuthButtonsProps) {
  const { openSignIn, openSignUp } = useClerk();

  if (variant === "panel") {
    return (
      <>
        <button
          className="inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          onClick={() => openSignIn()}
          type="button"
        >
          Sign in
        </button>
        <button
          className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-950"
          onClick={() => openSignUp()}
          type="button"
        >
          Create account
        </button>
      </>
    );
  }

  return (
    <>
      <button
        className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:text-slate-950"
        onClick={() => openSignIn()}
        type="button"
      >
        Sign in
      </button>
      <button
        className="bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
        onClick={() => openSignUp()}
        type="button"
      >
        Sign up
      </button>
    </>
  );
}
