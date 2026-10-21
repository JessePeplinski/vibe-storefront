import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { appBaseUrl } from "@/lib/env";
import { completeStorefrontGenerationSlot, getStorefrontByOwnerAndIdea, releaseStorefrontGenerationSlot } from "@/lib/storefronts";
import type { GenerationJob } from "@/lib/generation-job";

type JobRow = {
  id: string;
  owner_clerk_user_id: string;
  idea: string;
  status: GenerationJob["status"];
  reservation_id: string | null;
  storefront_id: string | null;
  warning: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
  expires_at: string;
};

async function publicJob(row: JobRow): Promise<GenerationJob | null> {
  const pending = row.status === "queued" || row.status === "running";
  const expired = pending && Date.parse(row.expires_at) <= Date.now();
  const storefront = row.status === "completed" || expired
    ? await getStorefrontByOwnerAndIdea({ ownerClerkUserId: row.owner_clerk_user_id, idea: row.idea })
    : null;

  if (expired) {
    // Recover a save that succeeded before the worker could update its job row.
    const status = storefront ? "completed" : "failed";
    const finishedAt = storefront?.created_at ?? new Date().toISOString();
    const error = storefront ? null : "Generation timed out. Please try again.";
    // Finish/release quota first so a transient DB error cannot strand a terminal job's slot.
    if (row.reservation_id) {
      if (storefront) {
        await completeStorefrontGenerationSlot({ reservationId: row.reservation_id, storefrontId: storefront.id });
      } else {
        await releaseStorefrontGenerationSlot(row.reservation_id);
      }
    }
    const { error: updateError } = await createSupabaseServiceClient()
      .from("storefront_generation_jobs")
      .update({ status, finished_at: finishedAt, error, storefront_id: storefront?.id ?? null })
      .eq("id", row.id).eq("owner_clerk_user_id", row.owner_clerk_user_id).in("status", ["queued", "running"]);
    if (updateError) throw new Error("Unable to recover generation status.");
    row = { ...row, status, finished_at: finishedAt, error, storefront_id: storefront?.id ?? null };
  }

  // Deleting a storefront must not make an old job restore it into the dashboard.
  if (row.status === "completed" && (!storefront || row.storefront_id !== storefront.id)) return null;
  return {
    id: row.id,
    idea: row.idea,
    status: row.status,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
    error: row.error,
    result: storefront ? {
      storefront,
      shareUrl: `${appBaseUrl()}/s/${storefront.slug}`,
      status: "created",
      usageCost: storefront.generation_cost,
      ...(row.warning ? { warning: row.warning } : {})
    } : null
  };
}

export async function getLatestGenerationJob(ownerClerkUserId: string): Promise<GenerationJob | null> {
  const { data, error } = await createSupabaseServiceClient()
    .from("storefront_generation_jobs").select("*")
    .eq("owner_clerk_user_id", ownerClerkUserId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Unable to load generation status.");
  return data ? publicJob(data as JobRow) : null;
}

export async function createGenerationJob(ownerClerkUserId: string, idea: string): Promise<{ job: GenerationJob; created: boolean }> {
  const { data, error } = await createSupabaseServiceClient()
    .from("storefront_generation_jobs").insert({ owner_clerk_user_id: ownerClerkUserId, idea }).select("*").single();
  if (error?.code === "23505") {
    const existing = await getLatestGenerationJob(ownerClerkUserId);
    if (existing && (existing.status === "queued" || existing.status === "running")) return { job: existing, created: false };
  }
  if (error || !data) throw new Error("Unable to start generation.");
  return { job: (await publicJob(data as JobRow))!, created: true };
}

export async function claimGenerationJob(id: string, reservationId: string | null) {
  const { data, error } = await createSupabaseServiceClient()
    .from("storefront_generation_jobs").update({ status: "running", reservation_id: reservationId })
    .eq("id", id).eq("status", "queued").select("id").maybeSingle();
  if (error) throw new Error("Unable to start generation worker.");
  return Boolean(data);
}

export async function finishGenerationJob(id: string, result: { storefrontId: string; warning?: string } | { error: string }) {
  const values = "error" in result
    ? { status: "failed", error: result.error }
    : { status: "completed", storefront_id: result.storefrontId, warning: result.warning ?? null };
  const { error } = await createSupabaseServiceClient()
    .from("storefront_generation_jobs").update({ ...values, finished_at: new Date().toISOString() })
    .eq("id", id).in("status", ["queued", "running"]);
  if (error) throw new Error("Unable to save generation status.");
}
