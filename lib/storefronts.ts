import { buildStorefrontSlug } from "@/lib/slug";
import {
  type StorefrontContent,
  type StorefrontGenerationCost,
  type StorefrontRecord,
  storefrontContentSchema,
  storefrontGenerationCostSchema
} from "@/lib/storefront-schema";
import {
  createSupabasePublicClient,
  createSupabaseServiceClient
} from "@/lib/supabase/server";

type StorefrontRow = Omit<StorefrontRecord, "content" | "generation_cost"> & {
  content: unknown;
  generation_cost?: unknown | null;
};

type StorefrontGenerationSlotRow = {
  id: string;
};

type SupabaseError = {
  code?: string;
  message: string;
};

type StorefrontOwner =
  | {
      ownerClerkUserId: string;
      anonymousSessionId?: never;
    }
  | {
      anonymousSessionId: string;
      ownerClerkUserId?: never;
    };

function parseStorefront(row: StorefrontRow): StorefrontRecord {
  return {
    ...row,
    content: storefrontContentSchema.parse(row.content),
    generation_cost: row.generation_cost
      ? storefrontGenerationCostSchema.parse(row.generation_cost)
      : null
  };
}

export function normalizeStorefrontIdea(idea: string): string {
  return idea.trim().replace(/\s+/g, " ").toLowerCase();
}

function storefrontOwnerFields(params: StorefrontOwner) {
  if ("ownerClerkUserId" in params) {
    return {
      owner_clerk_user_id: params.ownerClerkUserId,
      anonymous_session_id: null
    };
  }

  return {
    owner_clerk_user_id: null,
    anonymous_session_id: params.anonymousSessionId
  };
}

function isMissingGenerationCostColumnError(message: string): boolean {
  return (
    message.includes("generation_cost") &&
    (message.includes("schema cache") || message.includes("column"))
  );
}

function isUniqueViolationError(error: SupabaseError): boolean {
  return (
    error.code === "23505" ||
    error.message.toLowerCase().includes("duplicate key")
  );
}

export async function createStorefront(
  params: StorefrontOwner & {
    idea: string;
    content: StorefrontContent;
    generationCost?: StorefrontGenerationCost | null;
    slug?: string;
  }
): Promise<StorefrontRecord> {
  const supabase = createSupabaseServiceClient();
  const slug = params.slug ?? buildStorefrontSlug(params.content.name);
  const insertPayload = {
    ...storefrontOwnerFields(params),
    idea: params.idea,
    slug,
    content: params.content,
    published: true
  };
  const insertPayloadWithCost = params.generationCost
    ? {
        ...insertPayload,
        generation_cost: params.generationCost
      }
    : insertPayload;

  let { data, error } = await supabase
    .from("storefronts")
    .insert(insertPayloadWithCost)
    .select("*")
    .single();

  if (
    error &&
    params.generationCost &&
    isMissingGenerationCostColumnError(error.message)
  ) {
    const retry = await supabase
      .from("storefronts")
      .insert(insertPayload)
      .select("*")
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Unable to save storefront: ${error.message}`);
  }

  return parseStorefront(data as StorefrontRow);
}

export async function reserveStorefrontGenerationSlot(
  ownerClerkUserId: string
): Promise<StorefrontGenerationSlotRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("storefront_generation_slots")
    .insert({
      owner_clerk_user_id: ownerClerkUserId,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolationError(error)) {
      return null;
    }

    throw new Error(`Unable to reserve generation slot: ${error.message}`);
  }

  return data as StorefrontGenerationSlotRow;
}

export async function completeStorefrontGenerationSlot(params: {
  reservationId: string;
  storefrontId: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("storefront_generation_slots")
    .update({
      status: "created",
      storefront_id: params.storefrontId
    })
    .eq("id", params.reservationId);

  if (error) {
    throw new Error(`Unable to complete generation slot: ${error.message}`);
  }
}

export async function releaseStorefrontGenerationSlot(
  reservationId: string
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("storefront_generation_slots")
    .delete()
    .eq("id", reservationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Unable to release generation slot: ${error.message}`);
  }
}

export async function listStorefrontsForOwner(
  ownerClerkUserId: string
): Promise<StorefrontRecord[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("storefronts")
    .select("*")
    .eq("owner_clerk_user_id", ownerClerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load storefronts: ${error.message}`);
  }

  return ((data ?? []) as StorefrontRow[]).map(parseStorefront);
}

export async function deleteStorefrontForOwner(params: {
  ownerClerkUserId: string;
  storefrontId: string;
}): Promise<StorefrontRecord | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("storefronts")
    .delete()
    .eq("id", params.storefrontId)
    .eq("owner_clerk_user_id", params.ownerClerkUserId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to delete storefront: ${error.message}`);
  }

  return data ? parseStorefront(data as StorefrontRow) : null;
}

export async function listPublishedStorefronts(
  limit?: number
): Promise<StorefrontRecord[]> {
  const supabase = createSupabasePublicClient();
  let query = supabase
    .from("storefronts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load storefronts: ${error.message}`);
  }

  return ((data ?? []) as StorefrontRow[]).map(parseStorefront);
}

export async function getStorefrontByOwnerAndIdea(
  params: StorefrontOwner & {
    idea: string;
  }
): Promise<StorefrontRecord | null> {
  const supabase = createSupabaseServiceClient();
  const normalizedIdea = normalizeStorefrontIdea(params.idea);
  const query = supabase
    .from("storefronts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data, error } =
    "ownerClerkUserId" in params
      ? await query.eq("owner_clerk_user_id", params.ownerClerkUserId)
      : await query.eq("anonymous_session_id", params.anonymousSessionId);

  if (error) {
    throw new Error(`Unable to load matching storefront: ${error.message}`);
  }

  const storefronts = ((data ?? []) as StorefrontRow[]).map(parseStorefront);
  return (
    storefronts.find(
      (storefront) => normalizeStorefrontIdea(storefront.idea) === normalizedIdea
    ) ?? null
  );
}

export async function getPublicStorefrontBySlug(
  slug: string
): Promise<StorefrontRecord | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("storefronts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load storefront: ${error.message}`);
  }

  return data ? parseStorefront(data as StorefrontRow) : null;
}
