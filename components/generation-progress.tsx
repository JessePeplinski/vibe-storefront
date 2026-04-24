import type { GenerationPhase } from "@/components/use-generation-countdown";

type GenerationProgressProps = {
  currentPhaseIndex: number;
  elapsedText: string;
  estimateText: string;
  phases: GenerationPhase[];
  variant?: "dark" | "light";
};

export function GenerationProgress({
  currentPhaseIndex,
  elapsedText,
  estimateText,
  phases,
  variant = "light"
}: GenerationProgressProps) {
  const isDark = variant === "dark";
  const labelClass = isDark ? "text-teal-100" : "text-slate-800";
  const mutedClass = isDark ? "text-stone-300" : "text-slate-500";
  const borderClass = isDark ? "border-white/15" : "border-slate-200";
  const activeClass = isDark
    ? "border-teal-200 bg-teal-200 text-slate-950"
    : "border-slate-950 bg-slate-950 text-white";
  const inactiveClass = isDark
    ? "border-white/15 text-stone-300"
    : "border-slate-200 text-slate-500";

  return (
    <div
      aria-label="Generation progress"
      className={`mt-3 border-t ${borderClass} pt-3`}
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
          Estimated step {currentPhaseIndex + 1} of {phases.length}
        </p>
        <p
          aria-live="polite"
          className={`text-xs font-black tabular-nums ${mutedClass}`}
        >
          Elapsed {elapsedText}
        </p>
      </div>
      <ol className="mt-3 grid gap-2">
        {phases.map((phase, index) => {
          const isActive = index === currentPhaseIndex;
          const isComplete = index < currentPhaseIndex;

          return (
            <li
              className={`flex min-h-8 items-center gap-2 text-xs font-bold ${
                isActive ? labelClass : mutedClass
              }`}
              key={phase.label}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-black ${
                  isActive || isComplete ? activeClass : inactiveClass
                }`}
              >
                {index + 1}
              </span>
              <span>{phase.label}</span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-2 text-xs font-semibold ${mutedClass}`}>
        {estimateText}
      </p>
    </div>
  );
}
