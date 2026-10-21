import type { StorefrontRecord } from "@/lib/storefront-schema";

export type GenerationJobResult = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status: "created";
  usageCost?: StorefrontRecord["generation_cost"];
  warning?: string;
};

export type GenerationJob = {
  id: string;
  idea: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
  result: GenerationJobResult | null;
};

export function isPendingGenerationJob(job: GenerationJob) {
  return job.status === "queued" || job.status === "running";
}
