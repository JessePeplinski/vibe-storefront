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

function parseStorefront(row: StorefrontRow): StorefrontRecord {
  return {
    ...row,
    content: storefrontContentSchema.parse(row.content)
  };
}

export async function createStorefront(params: {
  ownerClerkUserId: string;
  idea: string;
  content: StorefrontContent;
}): Promise<StorefrontRecord> {
  const supabase = createSupabaseServiceClient();
  const slug = buildStorefrontSlug(params.content.name);

  const { data, error } = await supabase
    .from("storefronts")
    .insert({
      owner_clerk_user_id: params.ownerClerkUserId,
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
