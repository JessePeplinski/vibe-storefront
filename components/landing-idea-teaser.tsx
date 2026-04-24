"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { ArrowRight, LockKeyhole, WandSparkles } from "lucide-react";
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";

export function LandingIdeaTeaser() {
  const { openSignIn, openSignUp } = useClerk();
  const [idea, setIdea] = useState<string>(STARTER_IDEAS[0]);

  function storeDraftIdea() {
    const trimmedIdea = idea.trim();

    if (trimmedIdea.length < 6) {
      return false;
    }

    window.localStorage.setItem(DRAFT_IDEA_STORAGE_KEY, trimmedIdea);
    return true;
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (storeDraftIdea()) {
      openSignIn();
    }
  }

  function handleSignUp() {
    if (storeDraftIdea()) {
      openSignUp();
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
          <LockKeyhole className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Start in Studio
          </h2>
          <p className="text-sm leading-5 text-slate-500">
            Saved storefronts are tied to your Clerk user.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-2">
        {STARTER_IDEAS.map((starterIdea) => (
          <button
            className="inline-flex min-h-12 items-center gap-2 border border-slate-200 px-3 py-2 text-left text-sm font-bold leading-5 text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
            key={starterIdea}
            onClick={() => setIdea(starterIdea)}
            type="button"
          >
            <WandSparkles
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden
            />
            <span>{starterIdea}</span>
          </button>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSignIn}>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Product idea
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-none border-slate-300 text-base text-slate-950 shadow-sm focus:border-slate-950 focus:ring-slate-950"
            id="landing-product-idea"
            maxLength={220}
            minLength={6}
            name="idea"
            onChange={(event) => setIdea(event.target.value)}
            required
            value={idea}
          />
        </label>
        <button
          className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          type="submit"
        >
          Continue in Studio
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        <button
          className="w-full border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-950"
          onClick={handleSignUp}
          type="button"
        >
          Create account
        </button>
      </form>
    </section>
  );
}
