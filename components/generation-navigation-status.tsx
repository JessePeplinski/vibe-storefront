"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { GenerationProgress } from "@/components/generation-progress";
import { useGenerationSession } from "@/components/use-storefront-generation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function GenerationNavigationStatus() {
  const session = useGenerationSession();
  const pathname = usePathname();
  const router = useRouter();
  const notice = session?.completionNotice;
  const dismiss = session?.dismissCompletionNotice;
  const isViewingResult = pathname === "/dashboard" || pathname === notice?.href;

  useEffect(() => {
    if (!notice) return;
    if (!isViewingResult) {
      toast.success("Storefront ready", {
        id: `storefront-ready-${notice.id}`,
        description: notice.name,
        duration: 10000,
        action: {
          label: "Open storefront",
          onClick: () => router.push(notice.href)
        }
      });
    }
    dismiss?.();
  }, [notice, isViewingResult, dismiss, router]);

  if (!session?.isGenerating) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="View generation progress"
          className="shrink-0 px-3 text-primary"
          type="button"
          variant="outline"
        >
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
          <span className="hidden sm:inline">Generating</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-5 pt-14 sm:max-w-3xl">
        <SheetHeader className="p-0">
          <SheetTitle>Generating storefront</SheetTitle>
          <SheetDescription>You can keep browsing. We’ll let you know when your storefront is ready.</SheetDescription>
        </SheetHeader>
        <p className="break-words text-sm font-semibold">{session.idea}</p>
        <GenerationProgress {...session.progress} elapsedText={session.progress.elapsedText ?? "0:00"} />
        <p className="text-xs text-muted-foreground">Steps and progress are estimated.</p>
        {session.statusUnavailable && (
          <p role="status" className="text-sm text-muted-foreground">Reconnecting to check progress. Your generation is still running on the server.</p>
        )}
        <SheetClose asChild>
          <Button asChild>
            <Link href="/dashboard#your-storefronts">Your storefronts</Link>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
