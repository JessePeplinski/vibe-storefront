import type { Metadata } from "next";
import { RevealDeck } from "@/components/deck/reveal-deck";

export const metadata: Metadata = {
  title: "Vibe Storefront | Codex project deck",
  description:
    "A Reveal.js deck for the Vibe Storefront Codex project walkthrough."
};

export default function DeckPage() {
  return <RevealDeck />;
}
