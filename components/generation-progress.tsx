import { Check } from "lucide-react";
import type { GenerationProgressStep } from "@/components/use-generation-countdown";

type GenerationProgressProps = {
  currentPhaseIndex: number;
  elapsedText: string;
  estimateText: string;
  progressPercent: number;
  showOverallEstimate?: boolean;
  steps: GenerationProgressStep[];
};

export function GenerationProgress({
  currentPhaseIndex,
  elapsedText,
  estimateText,
  progressPercent,
  showOverallEstimate = true,
  steps
}: GenerationProgressProps) {
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));
  const activeStep = steps[currentPhaseIndex];

  return (
    <div
      aria-label="Generation progress"
      className="border-t border-slate-200 pt-4"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            Step {currentPhaseIndex + 1} of {steps.length}
          </p>
          <p className="mt-1 text-sm font-black leading-5 text-slate-950">
            {activeStep?.label ?? "Generating storefront"}
          </p>
        </div>
        <p
          aria-live="polite"
          className="shrink-0 text-sm font-black tabular-nums text-slate-700"
        >
          Total {elapsedText}
        </p>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden bg-slate-100" aria-hidden>
        <div
          className="h-full bg-emerald-700 transition-[width] duration-300 ease-out"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-1 gap-0 sm:grid-cols-4 sm:gap-x-4">
        {steps.map((step, index) => {
          const isActive = step.status === "active";
          const isComplete = step.status === "complete";
          const connectorClass = isComplete ? "bg-emerald-700" : "bg-slate-200";
          const markerClass = isComplete
            ? "border-emerald-700 bg-emerald-700 text-white"
            : isActive
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-300 bg-white text-slate-400";
          const labelClass =
            isActive || isComplete ? "text-slate-950" : "text-slate-500";
          const timeClass =
            isActive || isComplete ? "text-slate-700" : "text-slate-400";

          return (
            <li
              className="relative flex min-h-[4.5rem] min-w-0 items-start gap-2 pb-3 last:min-h-0 last:pb-0 sm:min-h-[4rem] sm:pb-0"
              key={step.label}
            >
              {index < steps.length - 1 && (
                <span
                  className={`absolute bottom-1 left-3.5 top-8 w-px sm:hidden ${connectorClass}`}
                  data-generation-connector="true"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-black ${markerClass}`}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-xs font-black leading-4 ${labelClass}`}
                >
                  {step.label}
                </span>
                <span
                  className={`mt-1 block text-xs font-bold tabular-nums ${timeClass}`}
                >
                  {step.elapsedText
                    ? `Elapsed ${step.elapsedText}`
                    : step.estimateLabel}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {showOverallEstimate && (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {estimateText}
        </p>
      )}
    </div>
  );
}
