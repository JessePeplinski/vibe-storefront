"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";
import { useGenerationSession } from "@/components/use-storefront-generation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function GenerationCompletionNotification() {
  const session = useGenerationSession();
  const pathname = usePathname();
  const notice = session?.completionNotice;
  const dismiss = session?.dismissCompletionNotice;
  const isViewingResult = pathname === "/dashboard" || pathname === notice?.href;

  useEffect(() => {
    if (notice && isViewingResult) dismiss?.();
  }, [notice, isViewingResult, dismiss]);

  if (!notice || isViewingResult) return null;

  return (
    <>
      <span className="sr-only" role="status">{notice.name} is ready. Open notifications to view your storefront.</span>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            aria-label="Notifications: storefront ready"
            className="relative shrink-0 text-primary"
            size="icon"
            type="button"
            variant="outline"
          >
            <Bell className="size-4" aria-hidden />
            <span aria-hidden className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">1</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="p-5 pt-14">
          <SheetHeader className="p-0">
            <CheckCircle2 className="size-6 text-primary" aria-hidden />
            <SheetTitle>Storefront ready</SheetTitle>
            <SheetDescription>Your storefront finished generating while you were browsing.</SheetDescription>
          </SheetHeader>
          <p className="break-words text-lg font-black">{notice.name}</p>
          <Button asChild>
            <Link href={notice.href} onClick={dismiss}>
              Open storefront
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button onClick={dismiss} type="button" variant="ghost">Dismiss notification</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
