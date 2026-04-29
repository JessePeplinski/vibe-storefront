"use client";

import { useState, type FormEvent } from "react";
import { useClerk } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import { StorefrontGenerationForm } from "@/components/storefront-generation-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DRAFT_IDEA_STORAGE_KEY } from "@/lib/studio-ideas";

const idleProgress = {
  currentPhaseIndex: 0,
  elapsedText: null,
  estimateText: "",
  progressPercent: 0,
  steps: []
};

export function LandingIdeaTeaser() {
  const { openSignIn } = useClerk();
  const [idea, setIdea] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedIdea = idea.trim();

    if (trimmedIdea.length >= 6) {
      window.localStorage.setItem(DRAFT_IDEA_STORAGE_KEY, trimmedIdea);
    }

    openSignIn();
  }

  return (
    <StorefrontGenerationForm
      feedback={
        <Alert variant="warning">
          <AlertTitle>Sign-in required</AlertTitle>
          <AlertDescription>
            Public generation is temporarily locked down. Sign in to generate
            one storefront.
          </AlertDescription>
        </Alert>
      }
      generationDisabled={false}
      idea={idea}
      isGenerating={false}
      onIdeaChange={setIdea}
      onSubmit={handleSubmit}
      progress={idleProgress}
      secondaryAction={{
        href: "/storefronts",
        label: "See all storefronts"
      }}
      submitIcon={<LogIn className="h-4 w-4" aria-hidden />}
      submitLabel="Sign in to generate"
      textareaId="landing-product-idea"
    />
  );
}
