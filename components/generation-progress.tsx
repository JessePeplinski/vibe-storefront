import { Progress } from "@/components/ui/progress";
import type { GenerationProgressStep } from "@/components/use-generation-countdown";
import { cn } from "@/lib/utils";

type GenerationProgressProps = {
  currentPhaseIndex: number;
  elapsedSeconds: number;
  elapsedText: string;
  estimateText: string;
  progressPercent: number;
  showOverallEstimate?: boolean;
  steps: GenerationProgressStep[];
};

type GenerationFeedLine = {
  startsAtSecond: number;
  text: string;
};

const VISIBLE_FEED_LINE_COUNT = 4;
const GENERATION_FEED_LINES: GenerationFeedLine[] = [
  {
    startsAtSecond: 0,
    text: "Reading the product idea and shaping a storefront brief."
  },
  {
    startsAtSecond: 5,
    text: "Drafting the offer, audience, and product position."
  },
  {
    startsAtSecond: 12,
    text: "Writing launch copy with a clear ecommerce structure."
  },
  {
    startsAtSecond: 20,
    text: "Checking the storefront schema before moving forward."
  },
  {
    startsAtSecond: 30,
    text: "Generating product image direction from the concept."
  },
  {
    startsAtSecond: 42,
    text: "Composing the product hero and supporting visual details."
  },
  {
    startsAtSecond: 60,
    text: "Waiting on image generation to finish cleanly."
  },
  {
    startsAtSecond: 82,
    text: "Reviewing generated visual output for the storefront."
  },
  {
    startsAtSecond: 110,
    text: "Saving the product image asset."
  },
  {
    startsAtSecond: 118,
    text: "Attaching the image to the generated storefront."
  },
  {
    startsAtSecond: 125,
    text: "Publishing the share page and final storefront data."
  },
  {
    startsAtSecond: 132,
    text: "Preparing the storefront result."
  },
  {
    startsAtSecond: 145,
    text: "Still working. Some image runs take a little longer."
  }
];

function getVisibleFeedLines(elapsedSeconds: number): GenerationFeedLine[] {
  const availableLines = GENERATION_FEED_LINES.filter(
    (line) => elapsedSeconds >= line.startsAtSecond
  );

  return (availableLines.length > 0
    ? availableLines
    : [GENERATION_FEED_LINES[0]]
  ).slice(-VISIBLE_FEED_LINE_COUNT);
}

export function GenerationProgress({
  currentPhaseIndex,
  elapsedSeconds,
  elapsedText,
  estimateText,
  progressPercent,
  showOverallEstimate = true,
  steps
}: GenerationProgressProps) {
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));
  const activeStep = steps[currentPhaseIndex];
  const activeLabel = activeStep?.label ?? "Generating storefront";
  const visibleFeedLines = getVisibleFeedLines(elapsedSeconds);

  return (
    <div
      aria-label="Generation progress"
      className="border-t pt-4"
      role="status"
    >
      <p className="sr-only" aria-live="polite">
        Generating storefront. {activeLabel}. Elapsed {elapsedText}.
      </p>
      <div
        aria-hidden
        className="overflow-hidden rounded-lg border border-emerald-900/15 bg-[#101511] text-[#edf7f0] shadow-glow"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
              <span>Thinking</span>
              <span className="flex items-center gap-0.5" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-emerald-200 animate-pulse" />
                <span className="h-1 w-1 rounded-full bg-emerald-200 animate-pulse [animation-delay:160ms]" />
                <span className="h-1 w-1 rounded-full bg-emerald-200 animate-pulse [animation-delay:320ms]" />
              </span>
            </p>
            <p className="mt-1 text-sm font-black leading-5 text-white">
              {activeLabel}
            </p>
          </div>
          <p className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-black tabular-nums text-emerald-50">
            Total {elapsedText}
          </p>
        </div>

        <div className="px-4 py-4">
          <div className="relative h-40 overflow-hidden sm:h-28">
            <div className="absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#101511] to-transparent" />
            <ol className="grid gap-1.5 sm:gap-2">
              {visibleFeedLines.map((line, index) => {
                const isCurrent = index === visibleFeedLines.length - 1;

                return (
                  <li
                    className={cn(
                      "flex min-w-0 animate-in fade-in-0 slide-in-from-bottom-1 items-start gap-2 text-xs leading-4 transition-opacity duration-300 sm:text-sm sm:leading-5",
                      isCurrent ? "text-white" : "text-emerald-50/60"
                    )}
                    key={line.text}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-2",
                        isCurrent ? "bg-emerald-300" : "bg-emerald-100/30"
                      )}
                    />
                    <span className="min-w-0 text-balance">{line.text}</span>
                  </li>
                );
              })}
            </ol>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#101511] to-transparent" />
          </div>

          <div className="mt-4">
            <Progress
              className="[&>div]:bg-emerald-300/90 h-1 bg-white/10"
              value={boundedProgress}
            />
            {showOverallEstimate && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-emerald-50/55">
                <span>{estimateText}</span>
                <span>
                  {Math.round(boundedProgress)}
                  {"%"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
