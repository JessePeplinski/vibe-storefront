import { DEFAULT_CODEX_MODEL } from "@/lib/codex-config";

const TOKENS_PER_MILLION = 1_000_000;
const DEFAULT_COSTED_IMAGE_MODEL = "gpt-image-2";

export type CodexTokenUsage = {
  cached_input_tokens: number;
  input_tokens: number;
  output_tokens: number;
};

export type OpenAIImageUsage = {
  input_tokens?: number;
  input_tokens_details?: {
    cached_image_tokens?: number;
    cached_text_tokens?: number;
    cached_tokens?: number;
    image_tokens?: number;
    text_tokens?: number;
  };
  output_tokens?: number;
  output_tokens_details?: {
    image_tokens?: number;
    text_tokens?: number;
  };
  total_tokens?: number;
};

type CodexModelPricing = {
  cachedInputUsdPer1M: number;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

type ImageModelPricing = {
  cachedImageInputUsdPer1M?: number;
  cachedTextInputUsdPer1M?: number;
  imageInputUsdPer1M: number;
  imageOutputUsdPer1M: number;
  textInputUsdPer1M: number;
  textOutputUsdPer1M?: number;
};

export type PublicUsageCost = {
  currency: "USD";
  imageUsd: number | null;
  isEstimate: true;
  textUsd: number | null;
  totalUsd: number;
  unavailableLineItems: string[];
};

export type UsageCostBreakdown = PublicUsageCost & {
  imageModel?: string;
  imageUsage?: OpenAIImageUsage | null;
  textModel?: string;
  textUsage?: CodexTokenUsage | null;
};

const CODEX_MODEL_PRICING: Record<string, CodexModelPricing> = {
  [DEFAULT_CODEX_MODEL]: {
    cachedInputUsdPer1M: 0.175,
    inputUsdPer1M: 1.75,
    outputUsdPer1M: 14
  },
  "gpt-5.2-codex": {
    cachedInputUsdPer1M: 0.125,
    inputUsdPer1M: 1.25,
    outputUsdPer1M: 10
  }
};

const IMAGE_MODEL_PRICING: Record<string, ImageModelPricing> = {
  [DEFAULT_COSTED_IMAGE_MODEL]: {
    cachedImageInputUsdPer1M: 2,
    cachedTextInputUsdPer1M: 1.25,
    imageInputUsdPer1M: 8,
    imageOutputUsdPer1M: 30,
    textInputUsdPer1M: 5
  },
  "gpt-image-1.5": {
    cachedImageInputUsdPer1M: 2,
    cachedTextInputUsdPer1M: 1.25,
    imageInputUsdPer1M: 8,
    imageOutputUsdPer1M: 32,
    textInputUsdPer1M: 5,
    textOutputUsdPer1M: 10
  }
};

function sanitizedModelKey(model: string): string {
  return model.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function envPrice(model: string, priceKey: string): number | null {
  const value =
    process.env[`OPENAI_USAGE_PRICE_${sanitizedModelKey(model)}_${priceKey}`];

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function withCodexEnvOverrides(
  model: string,
  pricing: CodexModelPricing
): CodexModelPricing {
  return {
    cachedInputUsdPer1M:
      envPrice(model, "CACHED_INPUT_USD_PER_1M") ??
      pricing.cachedInputUsdPer1M,
    inputUsdPer1M:
      envPrice(model, "INPUT_USD_PER_1M") ?? pricing.inputUsdPer1M,
    outputUsdPer1M:
      envPrice(model, "OUTPUT_USD_PER_1M") ?? pricing.outputUsdPer1M
  };
}

function withImageEnvOverrides(
  model: string,
  pricing: ImageModelPricing
): ImageModelPricing {
  return {
    cachedImageInputUsdPer1M:
      envPrice(model, "CACHED_IMAGE_INPUT_USD_PER_1M") ??
      pricing.cachedImageInputUsdPer1M,
    cachedTextInputUsdPer1M:
      envPrice(model, "CACHED_TEXT_INPUT_USD_PER_1M") ??
      pricing.cachedTextInputUsdPer1M,
    imageInputUsdPer1M:
      envPrice(model, "IMAGE_INPUT_USD_PER_1M") ??
      pricing.imageInputUsdPer1M,
    imageOutputUsdPer1M:
      envPrice(model, "IMAGE_OUTPUT_USD_PER_1M") ??
      pricing.imageOutputUsdPer1M,
    textInputUsdPer1M:
      envPrice(model, "TEXT_INPUT_USD_PER_1M") ??
      pricing.textInputUsdPer1M,
    textOutputUsdPer1M:
      envPrice(model, "TEXT_OUTPUT_USD_PER_1M") ??
      pricing.textOutputUsdPer1M
  };
}

function roundUsd(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function tokenCost(tokens: number, priceUsdPer1M: number): number {
  return (tokens / TOKENS_PER_MILLION) * priceUsdPer1M;
}

function numericToken(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

export function estimateCodexCost(params: {
  model: string;
  usage: CodexTokenUsage | null;
}): number | null {
  if (!params.usage) {
    return null;
  }

  const configuredPricing = CODEX_MODEL_PRICING[params.model];
  if (!configuredPricing) {
    return null;
  }

  const pricing = withCodexEnvOverrides(params.model, configuredPricing);
  const cachedInputTokens = Math.min(
    numericToken(params.usage.cached_input_tokens),
    numericToken(params.usage.input_tokens)
  );
  const uncachedInputTokens = Math.max(
    0,
    numericToken(params.usage.input_tokens) - cachedInputTokens
  );

  return roundUsd(
    tokenCost(uncachedInputTokens, pricing.inputUsdPer1M) +
      tokenCost(cachedInputTokens, pricing.cachedInputUsdPer1M) +
      tokenCost(numericToken(params.usage.output_tokens), pricing.outputUsdPer1M)
  );
}

export function estimateImageCost(params: {
  model: string;
  usage: OpenAIImageUsage | null;
}): number | null {
  if (!params.usage) {
    return null;
  }

  const configuredPricing = IMAGE_MODEL_PRICING[params.model];
  if (!configuredPricing) {
    return null;
  }

  const pricing = withImageEnvOverrides(params.model, configuredPricing);
  const inputDetails = params.usage.input_tokens_details;
  const outputDetails = params.usage.output_tokens_details;
  const totalInputTokens = numericToken(params.usage.input_tokens);
  const textInputTokens =
    inputDetails && "text_tokens" in inputDetails
      ? numericToken(inputDetails.text_tokens)
      : totalInputTokens;
  const imageInputTokens = numericToken(inputDetails?.image_tokens);
  const cachedTextInputTokens = Math.min(
    textInputTokens,
    numericToken(inputDetails?.cached_text_tokens) ||
      numericToken(inputDetails?.cached_tokens)
  );
  const cachedImageInputTokens = Math.min(
    imageInputTokens,
    numericToken(inputDetails?.cached_image_tokens)
  );
  const uncachedTextInputTokens = Math.max(
    0,
    textInputTokens - cachedTextInputTokens
  );
  const uncachedImageInputTokens = Math.max(
    0,
    imageInputTokens - cachedImageInputTokens
  );
  const imageOutputTokens =
    outputDetails && "image_tokens" in outputDetails
      ? numericToken(outputDetails.image_tokens)
      : numericToken(params.usage.output_tokens);
  const textOutputTokens = numericToken(outputDetails?.text_tokens);

  return roundUsd(
    tokenCost(uncachedTextInputTokens, pricing.textInputUsdPer1M) +
      tokenCost(
        cachedTextInputTokens,
        pricing.cachedTextInputUsdPer1M ?? pricing.textInputUsdPer1M
      ) +
      tokenCost(uncachedImageInputTokens, pricing.imageInputUsdPer1M) +
      tokenCost(
        cachedImageInputTokens,
        pricing.cachedImageInputUsdPer1M ?? pricing.imageInputUsdPer1M
      ) +
      tokenCost(imageOutputTokens, pricing.imageOutputUsdPer1M) +
      tokenCost(textOutputTokens, pricing.textOutputUsdPer1M ?? 0)
  );
}

export function estimateStorefrontGenerationCost(params: {
  imageModel?: string;
  imageUsage?: OpenAIImageUsage | null;
  textModel: string;
  textUsage: CodexTokenUsage | null;
}): UsageCostBreakdown {
  const textUsd = estimateCodexCost({
    model: params.textModel,
    usage: params.textUsage
  });
  const imageUsd = params.imageModel
    ? estimateImageCost({
        model: params.imageModel,
        usage: params.imageUsage ?? null
      })
    : null;
  const unavailableLineItems: string[] = [];

  if (textUsd === null) {
    unavailableLineItems.push("storefront copy");
  }

  if (params.imageModel && imageUsd === null) {
    unavailableLineItems.push("product image");
  }

  return {
    currency: "USD",
    imageModel: params.imageModel,
    imageUsage: params.imageUsage ?? null,
    imageUsd,
    isEstimate: true,
    textModel: params.textModel,
    textUsage: params.textUsage,
    textUsd,
    totalUsd: roundUsd((textUsd ?? 0) + (imageUsd ?? 0)),
    unavailableLineItems
  };
}

export function toPublicUsageCost(
  cost: UsageCostBreakdown
): PublicUsageCost | null {
  if (cost.totalUsd <= 0 && cost.unavailableLineItems.length > 0) {
    return null;
  }

  return {
    currency: cost.currency,
    imageUsd: cost.imageUsd,
    isEstimate: true,
    textUsd: cost.textUsd,
    totalUsd: cost.totalUsd,
    unavailableLineItems: cost.unavailableLineItems
  };
}
