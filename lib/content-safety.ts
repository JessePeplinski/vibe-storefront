import type { StorefrontContent } from "@/lib/storefront-schema";

export const CONTENT_CANNOT_BE_GENERATED_ERROR =
  "Content cannot be generated.";

const BLOCKED_NSFW_TERMS = [
  "adult toy",
  "adult toys",
  "anal",
  "arse",
  "arsehole",
  "ass",
  "asses",
  "asshole",
  "assholes",
  "bastard",
  "bastards",
  "bdsm",
  "bitch",
  "bitches",
  "blowjob",
  "blowjobs",
  "boob",
  "boobs",
  "boobies",
  "brothel",
  "brothels",
  "cam girl",
  "cam girls",
  "cam boy",
  "cam boys",
  "chaturbate",
  "cock",
  "cocks",
  "cum",
  "cumming",
  "cunt",
  "cunts",
  "dildo",
  "dildos",
  "dick",
  "dicks",
  "erotic",
  "erotica",
  "escort",
  "escorts",
  "fetish",
  "fuck",
  "fucked",
  "fucker",
  "fucking",
  "hentai",
  "incest",
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
  "porn hub",
  "pornhub",
  "porno",
  "pornographic",
  "pornography",
  "prostitute",
  "prostitutes",
  "prostitution",
  "pussy",
  "pussies",
  "rape",
  "raped",
  "raping",
  "rapist",
  "rapists",
  "sex",
  "sexual",
  "sex toy",
  "sex toys",
  "sexting",
  "shit",
  "shits",
  "shitty",
  "slut",
  "sluts",
  "strip club",
  "strip clubs",
  "stripper",
  "strippers",
  "tits",
  "titties",
  "titty",
  "vibrator",
  "vibrators",
  "whore",
  "whores",
  "xhamster",
  "xvideos",
  "xxx"
] as const;

const BLOCKED_COMPOUND_ROOTS = ["fuck", "porn", "shit", "xxx"] as const;

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
const blockedCompoundRootPatterns = BLOCKED_COMPOUND_ROOTS.map(
  buildBlockedTermPattern
);

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

  if (
    blockedCompoundRootPatterns.some(({ term }) =>
      tokens.some((token) => token.startsWith(term))
    )
  ) {
    return true;
  }

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
