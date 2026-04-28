import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { GenerationProgress } from "@/components/generation-progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GenerationProgressStep } from "@/components/use-generation-countdown";
import { cn } from "@/lib/utils";

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
  showLabel?: boolean;
  showOverallEstimate?: boolean;
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
  showLabel = true,
  showOverallEstimate = true,
  textareaId
}: StorefrontGenerationFormProps) {
  const actionLayout = secondaryAction
    ? "grid gap-3 sm:grid-cols-2"
    : "flex justify-end";

  return (
    <form
      className={cn(
        "space-y-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm sm:p-5",
        className
      )}
      onSubmit={onSubmit}
    >
      <Label className="block" htmlFor={textareaId}>
        {showLabel && (
          <span className="text-xl font-black text-slate-950">
            Generate your storefront
          </span>
        )}
        <Textarea
          aria-label={showLabel ? undefined : "Storefront idea"}
          className={cn(
            showLabel ? "mt-2" : "",
            "min-h-32 resize-none bg-muted/40 text-base text-slate-950 placeholder:text-muted-foreground sm:min-h-28"
          )}
          id={textareaId}
          maxLength={220}
          minLength={6}
          name="idea"
          onChange={(event) => onIdeaChange(event.target.value)}
          placeholder={IDEA_PLACEHOLDER}
          required
          value={idea}
        />
      </Label>

      {isGenerating && progress.elapsedText && (
        <GenerationProgress
          currentPhaseIndex={progress.currentPhaseIndex}
          elapsedText={progress.elapsedText}
          estimateText={progress.estimateText}
          progressPercent={progress.progressPercent}
          showOverallEstimate={showOverallEstimate}
          steps={progress.steps}
        />
      )}

      <div className={actionLayout}>
        <Button
          className={cn(secondaryAction && "w-full")}
          disabled={generationDisabled}
          size="lg"
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
        </Button>
        {secondaryAction && (
          <Button asChild className="w-full" size="lg" variant="outline">
            <Link href={secondaryAction.href}>
              {secondaryAction.label}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {feedback && <div className="pt-1">{feedback}</div>}
    </form>
  );
}
