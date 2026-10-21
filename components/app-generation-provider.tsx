"use client";

import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { StorefrontGenerationProvider } from "@/components/use-storefront-generation";

export function AppGenerationProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  return (
    <StorefrontGenerationProvider key={userId ?? "signed-out"}>
      {children}
    </StorefrontGenerationProvider>
  );
}
