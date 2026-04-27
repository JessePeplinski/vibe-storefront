import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { GenerationProgress } from "@/components/generation-progress";
import type { GenerationProgressStep } from "@/components/use-generation-countdown";

const IDEA_PLACEHOLDER =
  "Refillable shampoo bars for busy travelers, modular desk lamp kits for tiny apartments, or plant-based trail snacks for weekend hikers.";

type GenerationProgressState = {
  currentPhaseIndex: number;
  elapsedText: string | null;
  estimateText: string;
  progressPercent: number;
  steps: GenerationProgressStep[];
};

type SecondaryAction = {
  href: string;
  label: string;
};

type StorefrontGenerationFormProps = {
  className?: string;
  feedback?: ReactNode;
  generationDisabled: boolean;
  idea: string;
  isGenerating: boolean;
  onIdeaChange: (idea: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  progress: GenerationProgressState;
  secondaryAction?: SecondaryAction;
  textareaId: string;
};

export function StorefrontGenerationForm({
  className = "",
  feedback,
  generationDisabled,
  idea,
  isGenerating,
  onIdeaChange,
  onSubmit,
  progress,
  secondaryAction,
  textareaId
}: StorefrontGenerationFormProps) {
  const actionLayout = secondaryAction
    ? "grid gap-3 sm:grid-cols-2"
    : "flex justify-end";
  const buttonWidth = secondaryAction ? "w-full" : "";
  const disabledButtonTone = isGenerating
    ? "disabled:bg-slate-950 disabled:text-white"
    : "disabled:border disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-600";

  return (
    <form
      className={`space-y-3 border border-white/20 bg-white p-3 text-slate-950 shadow-sm sm:p-5 ${className}`}
      onSubmit={onSubmit}
    >
      <label className="block">
        <span className="text-xl font-black text-slate-950">
          Generate your storefront
        </span>
        <textarea
          className="mt-2 min-h-32 w-full resize-none border-slate-300 bg-slate-50 text-base text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-emerald-700 focus:ring-emerald-700 sm:min-h-28"
          id={textareaId}
          maxLength={220}
          minLength={6}
          name="idea"
          onChange={(event) => onIdeaChange(event.target.value)}
          placeholder={IDEA_PLACEHOLDER}
          required
          value={idea}
        />
      </label>

      {isGenerating && progress.elapsedText && (
        <GenerationProgress
          currentPhaseIndex={progress.currentPhaseIndex}
          elapsedText={progress.elapsedText}
          estimateText={progress.estimateText}
          progressPercent={progress.progressPercent}
          steps={progress.steps}
        />
      )}

      <div className={actionLayout}>
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed ${disabledButtonTone} ${buttonWidth}`}
          disabled={generationDisabled}
          type="submit"
        >
          <span>
            {isGenerating ? "Generating storefront" : "Generate storefront"}
          </span>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
        </button>
        {secondaryAction && (
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
            href={secondaryAction.href}
          >
            {secondaryAction.label}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {feedback && <div className="pt-1">{feedback}</div>}
    </form>
  );
}
