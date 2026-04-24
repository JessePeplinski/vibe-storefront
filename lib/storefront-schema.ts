import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const storefrontContentSchema = z.object({
  name: z.string().min(2).max(60),
  tagline: z.string().min(8).max(120),
  hero: z.object({
    eyebrow: z.string().min(2).max(50),
    headline: z.string().min(12).max(100),
    body: z.string().min(40).max(260)
  }),
  product: z.object({
    name: z.string().min(2).max(70),
    description: z.string().min(60).max(360),
    price: z.string().min(2).max(24),
    highlights: z.array(z.string().min(3).max(90)).min(3).max(5)
  }),
  theme: z.object({
    mood: z.string().min(3).max(60),
    palette: z.object({
      background: hexColor,
      surface: hexColor,
      primary: hexColor,
      secondary: hexColor,
      accent: hexColor,
      text: hexColor
    })
  }),
  cta: z.object({
    label: z.string().min(3).max(36),
    sublabel: z.string().min(8).max(90)
  }),
  testimonials: z
    .array(
      z.object({
        quote: z.string().min(24).max(180),
        name: z.string().min(2).max(48),
        role: z.string().min(2).max(70)
      })
    )
    .min(3)
    .max(3)
});

export type StorefrontContent = z.infer<typeof storefrontContentSchema>;

export type StorefrontRecord = {
  id: string;
  owner_clerk_user_id: string | null;
  anonymous_session_id: string | null;
  slug: string;
  idea: string;
  content: StorefrontContent;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export const sampleStorefrontContent: StorefrontContent = {
  name: "Brooklyn Ember Co.",
  tagline: "Small-batch heat with a neighborhood soul.",
  hero: {
    eyebrow: "Limited runs, big flavor",
    headline: "Hot sauce that tastes like a block party in a bottle.",
    body: "Brooklyn Ember Co. turns ripe peppers, roasted garlic, and bright vinegar into a layered sauce for eggs, tacos, noodles, and anything that needs a little swagger."
  },
  product: {
    name: "The Borough Blend",
    description:
      "A balanced hot sauce built around fermented red jalapenos, charred onion, and a citrus finish. It brings slow-building heat without flattening the food you put it on.",
    price: "$14",
    highlights: [
      "Fermented peppers for bright, rounded heat",
      "Hand-bottled in tiny numbered batches",
      "Built for breakfast sandwiches, dumplings, and grilled meats"
    ]
  },
  theme: {
    mood: "Urban pantry with sharp contrast and warm accents",
    palette: {
      background: "#f7efe5",
      surface: "#fffaf3",
      primary: "#b3261e",
      secondary: "#17324d",
      accent: "#f2b84b",
      text: "#171717"
    }
  },
  cta: {
    label: "Reserve a bottle",
    sublabel: "Batch drops are small. Get the next run before it sells out."
  },
  testimonials: [
    {
      quote:
        "It has enough heat to wake everything up, but the flavor is what keeps me reaching for it.",
      name: "Maya R.",
      role: "Pop-up chef"
    },
    {
      quote:
        "I put it on dumplings once and then quietly rearranged my whole fridge around it.",
      name: "Jon Bell",
      role: "Sauce obsessive"
    },
    {
      quote:
        "The kind of condiment that makes a weeknight dinner feel designed instead of assembled.",
      name: "Priya S.",
      role: "Home cook"
    }
  ]
};
