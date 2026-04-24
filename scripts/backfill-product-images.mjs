import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_IMAGE_BUCKET = "storefront-product-images";
const DEFAULT_PRODUCT_IMAGE_MODEL = "gpt-image-2";
const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);

    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];

    if (next && !next.startsWith("--")) {
      args[rawKey] = next;
      index += 1;
    } else {
      args[rawKey] = true;
    }
  }

  return args;
}

function loadEnvFile(path) {
  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine.slice(separatorIndex + 1);

    process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isLocalSupabaseUrl(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function buildProductImageStoragePath(slug, generatedAt = new Date()) {
  const timestamp = generatedAt.toISOString().replace(/\D/g, "").slice(0, 14);
  return `storefronts/${slugify(slug) || "storefront"}/product-${timestamp}.webp`;
}

function buildProductImageAlt(content) {
  return `${content.product.name} product image for ${content.name}`;
}

function buildProductImagePrompt({ content, idea }) {
  const palette = Object.entries(content.theme.palette)
    .map(([name, color]) => `${name}: ${color}`)
    .join(", ");

  return [
    "Create a realistic ecommerce hero product image for a generated storefront.",
    "Show the product clearly as the main subject in polished commercial studio lighting.",
    "Use a square composition, clean background, soft shadows, and premium product photography styling.",
    "Do not include readable text, labels, logos, watermarks, people, hands, or UI.",
    "",
    `Original product idea: ${idea}`,
    `Brand: ${content.name}`,
    `Product: ${content.product.name}`,
    `Product description: ${content.product.description}`,
    `Storefront mood: ${content.theme.mood}`,
    `Color palette hints: ${palette}`
  ].join("\n");
}

function contentHasProductImage(content) {
  return Boolean(content?.product?.image?.url && content.product.image.storagePath);
}

function assertBackfillableContent(row) {
  if (!row.content?.product?.name || !row.content.product.description) {
    throw new Error(`Storefront ${row.id} is missing product content.`);
  }

  if (!row.content?.theme?.palette) {
    throw new Error(`Storefront ${row.id} is missing theme palette content.`);
  }
}

async function ensureProductImageBucket(supabase) {
  const { error: getError } = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);

  if (!getError) {
    const { error: updateError } = await supabase.storage.updateBucket(
      PRODUCT_IMAGE_BUCKET,
      {
        allowedMimeTypes: ["image/webp"],
        fileSizeLimit: 5242880,
        public: true
      }
    );

    if (updateError) {
      throw new Error(`Unable to update product image bucket: ${updateError.message}`);
    }

    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    PRODUCT_IMAGE_BUCKET,
    {
      allowedMimeTypes: ["image/webp"],
      fileSizeLimit: 5242880,
      public: true
    }
  );

  if (createError) {
    throw new Error(`Unable to create product image bucket: ${createError.message}`);
  }
}

async function requestProductImage({ apiKey, model, prompt }) {
  const response = await fetch(OPENAI_IMAGES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp"
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Unable to generate product image: ${
        payload.error?.message ?? response.statusText
      }`
    );
  }

  const imageBase64 = payload.data?.[0]?.b64_json;

  if (!imageBase64) {
    throw new Error("Unable to generate product image: missing image data.");
  }

  return Buffer.from(imageBase64, "base64");
}

async function uploadProductImage({ imageBytes, storagePath, supabase }) {
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, imageBytes, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false
    });

  if (error) {
    throw new Error(`Unable to upload product image: ${error.message}`);
  }

  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(storagePath)
    .data.publicUrl;
}

async function deleteUploadedImage({ storagePath, supabase }) {
  await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([storagePath]);
}

export async function backfillProductImages(options = {}) {
  const envPath = options.envPath ?? ".env.local";
  loadEnvFile(envPath);

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = process.env.OPENAI_API_KEY || requireEnv("CODEX_API_KEY");
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_PRODUCT_IMAGE_MODEL;
  const write = Boolean(options.write);
  const limit = options.limit ? Number(options.limit) : undefined;
  const isProduction = !isLocalSupabaseUrl(supabaseUrl);

  if (Number.isNaN(limit)) {
    throw new Error("--limit must be a number.");
  }

  if (isProduction && write && !options.confirmProduction) {
    throw new Error(
      "Refusing to write to a non-local Supabase URL without --confirm-production."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  if (write) {
    await ensureProductImageBucket(supabase);
  }

  const { data, error } = await supabase
    .from("storefronts")
    .select("id,slug,idea,content,published,created_at")
    .eq("published", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load storefronts: ${error.message}`);
  }

  const storefronts = (data ?? [])
    .filter((row) => !contentHasProductImage(row.content))
    .slice(0, limit);

  console.log(
    `${write ? "Backfilling" : "Dry run:"} ${storefronts.length} storefront(s) missing product images.`
  );

  let updated = 0;

  for (const row of storefronts) {
    assertBackfillableContent(row);
    console.log(`- ${row.slug}: ${row.content.name}`);

    if (!write) {
      continue;
    }

    const generatedAt = new Date();
    const storagePath = buildProductImageStoragePath(row.slug, generatedAt);
    const prompt = buildProductImagePrompt({
      content: row.content,
      idea: row.idea
    });
    const imageBytes = await requestProductImage({ apiKey, model, prompt });
    const url = await uploadProductImage({ imageBytes, storagePath, supabase });
    const image = {
      url,
      storagePath,
      alt: buildProductImageAlt(row.content),
      model,
      generatedAt: generatedAt.toISOString()
    };
    const content = {
      ...row.content,
      product: {
        ...row.content.product,
        image
      }
    };
    const { error: updateError } = await supabase
      .from("storefronts")
      .update({ content })
      .eq("id", row.id);

    if (updateError) {
      await deleteUploadedImage({ storagePath, supabase });
      throw new Error(`Unable to update ${row.slug}: ${updateError.message}`);
    }

    updated += 1;
  }

  console.log(`${write ? "Updated" : "Would update"} ${updated} storefront(s).`);

  return {
    matched: storefronts.length,
    updated,
    write
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));

  backfillProductImages({
    confirmProduction: Boolean(args["confirm-production"]),
    envPath: args.env ?? ".env.local",
    limit: args.limit,
    write: Boolean(args.write)
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
