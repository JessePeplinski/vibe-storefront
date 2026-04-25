import { buildStorefrontSlug } from "@/lib/slug";
import {
  type StorefrontContent,
  type StorefrontRecord,
  storefrontContentSchema
} from "@/lib/storefront-schema";
import {
  createSupabasePublicClient,
  createSupabaseServiceClient
} from "@/lib/supabase/server";

type StorefrontRow = Omit<StorefrontRecord, "content"> & {
  content: unknown;
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
    content: storefrontContentSchema.parse(row.content)
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

export async function createStorefront(
  params: StorefrontOwner & {
    idea: string;
    content: StorefrontContent;
    slug?: string;
  }
): Promise<StorefrontRecord> {
  const supabase = createSupabaseServiceClient();
  const slug = params.slug ?? buildStorefrontSlug(params.content.name);

  const { data, error } = await supabase
    .from("storefronts")
    .insert({
      ...storefrontOwnerFields(params),
      idea: params.idea,
      slug,
      content: params.content,
      published: true
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save storefront: ${error.message}`);
  }

  return parseStorefront(data as StorefrontRow);
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

export async function getStorefrontByAnonymousSession(
  anonymousSessionId: string
): Promise<StorefrontRecord | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("storefronts")
    .select("*")
    .eq("anonymous_session_id", anonymousSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load guest storefront: ${error.message}`);
  }

  return data ? parseStorefront(data as StorefrontRow) : null;
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
