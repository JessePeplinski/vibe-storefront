import { Card } from "@/components/ui/card";

export function StorefrontCardSkeleton() {
  return (
    <Card
      aria-label="Generating your storefront"
      className="grid gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center"
      role="status"
    >
      <span className="sr-only">Your new storefront will appear here. You can browse other pages while it generates.</span>
      <div aria-hidden className="h-16 w-full rounded-md bg-muted motion-safe:animate-pulse sm:w-[88px]" />
      <div aria-hidden className="min-w-0 space-y-3 motion-safe:animate-pulse">
        <div className="h-4 w-2/5 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
      </div>
      <div aria-hidden className="grid grid-cols-3 gap-2 motion-safe:animate-pulse sm:w-[230px]">
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-10 rounded-md bg-muted" />
      </div>
    </Card>
  );
}
