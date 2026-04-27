import type { StorefrontContent } from "@/lib/storefront-schema";

export const CONTENT_CANNOT_BE_GENERATED_ERROR =
  "Content cannot be generated.";

const BLOCKED_NSFW_TERMS = [
  "adult toy",
  "adult toys",
  "anal",
  "bdsm",
  "blowjob",
  "blowjobs",
  "brothel",
  "brothels",
  "cam girl",
  "cam girls",
  "cam boy",
  "cam boys",
  "dildo",
  "dildos",
  "erotic",
  "erotica",
  "escort",
  "escorts",
  "fetish",
  "hentai",
  "masturbate",
  "masturbation",
  "naked",
  "nsfw",
  "nude",
  "nudes",
  "onlyfans",
  "only fans",
  "orgy",
  "porn",
  "porno",
  "pornographic",
  "pornography",
  "prostitute",
  "prostitutes",
  "prostitution",
  "sex",
  "sexual",
  "sex toy",
  "sex toys",
  "sexting",
  "strip club",
  "strip clubs",
  "stripper",
  "strippers",
  "vibrator",
  "vibrators",
  "xxx"
] as const;

type BlockedTermPattern = {
  phrase: string;
  term: string;
  tokens: string[];
};

const CHARACTER_SUBSTITUTIONS: Record<string, string> = {
  "!": "i",
  "$": "s",
  "+": "t",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a"
};

function normalizeText(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!$+0134578@]/g, (character) => {
      return CHARACTER_SUBSTITUTIONS[character] ?? character;
    });
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function buildBlockedTermPattern(term: string): BlockedTermPattern {
  const tokens = tokenize(term);

  return {
    phrase: ` ${tokens.join(" ")} `,
    term: tokens.join(""),
    tokens
  };
}

const blockedTermPatterns = BLOCKED_NSFW_TERMS.map(buildBlockedTermPattern);

function hasSplitTokenMatch(tokens: string[], term: string): boolean {
  for (let startIndex = 0; startIndex < tokens.length; startIndex += 1) {
    let candidate = "";
    let pieces = 0;

    for (let index = startIndex; index < tokens.length; index += 1) {
      const token = tokens[index];

      if (token.length > 3) {
        break;
      }

      candidate += token;
      pieces += 1;

      if (candidate === term && pieces > 1) {
        return true;
      }

      if (candidate.length >= term.length) {
        break;
      }
    }
  }

  return false;
}

export function containsBlockedNsfwTerm(text: string): boolean {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return false;
  }

  const paddedText = ` ${tokens.join(" ")} `;

  return blockedTermPatterns.some(({ phrase, term, tokens: termTokens }) => {
    if (termTokens.length === 0) {
      return false;
    }

    if (termTokens.length > 1) {
      return paddedText.includes(phrase);
    }

    return tokens.includes(term) || hasSplitTokenMatch(tokens, term);
  });
}

function collectTextValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTextValues);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectTextValues);
  }

  return [];
}

export function storefrontContentContainsBlockedTerms(
  content: StorefrontContent
): boolean {
  return collectTextValues(content).some(containsBlockedNsfwTerm);
}
