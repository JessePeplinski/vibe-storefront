"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type AuthButtonsProps = {
  variant?: "header" | "panel";
};

export function AuthButtons({ variant = "header" }: AuthButtonsProps) {
  const { openSignIn } = useClerk();

  if (variant === "panel") {
    return (
      <Button
        className="w-full sm:w-auto"
        onClick={() => openSignIn()}
        type="button"
        size="lg"
      >
        Sign in
      </Button>
    );
  }

  return (
    <Button onClick={() => openSignIn()} type="button">
      Sign in
    </Button>
  );
}
