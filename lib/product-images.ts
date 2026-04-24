import { requireEnv } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  StorefrontContent,
  StorefrontProductImage
} from "@/lib/storefront-schema";

export const PRODUCT_IMAGE_BUCKET = "storefront-product-images";
export const DEFAULT_PRODUCT_IMAGE_MODEL = "gpt-image-2";

const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";

type GenerateProductImageParams = {
  content: StorefrontContent;
  idea: string;
  slug: string;
};

type OpenAIImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    code?: string | null;
    message?: string;
    type?: string;
  };
};

function productImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || DEFAULT_PRODUCT_IMAGE_MODEL;
}

function openAIKey(): string {
  return process.env.OPENAI_API_KEY || requireEnv("CODEX_API_KEY");
}

function safeStorageSegment(slug: string): string {
  return slugify(slug) || "storefront";
}

export function buildProductImageAlt(content: StorefrontContent): string {
  return `${content.product.name} product image for ${content.name}`;
}

export function buildProductImageStoragePath(
  slug: string,
  generatedAt = new Date()
): string {
  const timestamp = generatedAt.toISOString().replace(/\D/g, "").slice(0, 14);
  return `storefronts/${safeStorageSegment(slug)}/product-${timestamp}.webp`;
}

export function buildProductImagePrompt({
  content,
  idea
}: Omit<GenerateProductImageParams, "slug">): string {
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

async function parseOpenAIImageResponse(
  response: Response
): Promise<OpenAIImageGenerationResponse> {
  try {
    return (await response.json()) as OpenAIImageGenerationResponse;
  } catch {
    return {};
  }
}

async function requestProductImage(prompt: string): Promise<Buffer> {
  let response: Response;

  try {
    response = await fetch(OPENAI_IMAGES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: productImageModel(),
        prompt,
        size: "1024x1024",
        quality: "medium",
        output_format: "webp"
      })
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "request failed";
    throw new Error(`Unable to generate product image: ${message}`);
  }

  const payload = await parseOpenAIImageResponse(response);

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

async function uploadProductImage(
  imageBytes: Buffer,
  storagePath: string
): Promise<string> {
  const supabase = createSupabaseServiceClient();
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

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function deleteProductImage(storagePath: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Unable to delete product image: ${error.message}`);
  }
}

export async function generateProductImage({
  content,
  idea,
  slug
}: GenerateProductImageParams): Promise<StorefrontProductImage> {
  const generatedAt = new Date();
  const storagePath = buildProductImageStoragePath(slug, generatedAt);
  const prompt = buildProductImagePrompt({ content, idea });
  const imageBytes = await requestProductImage(prompt);
  const url = await uploadProductImage(imageBytes, storagePath);

  return {
    url,
    storagePath,
    alt: buildProductImageAlt(content),
    model: productImageModel(),
    generatedAt: generatedAt.toISOString()
  };
}

export const __testables = {
  buildProductImageAlt,
  buildProductImagePrompt,
  buildProductImageStoragePath
};
