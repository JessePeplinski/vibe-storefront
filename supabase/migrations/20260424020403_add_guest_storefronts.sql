alter table public.storefronts
  add column if not exists anonymous_session_id text,
  add column if not exists system_key text;

alter table public.storefronts
  alter column owner_clerk_user_id drop not null;

alter table public.storefronts
  drop constraint if exists storefronts_single_owner_chk;

alter table public.storefronts
  add constraint storefronts_single_owner_chk
  check (
    num_nonnulls(owner_clerk_user_id, anonymous_session_id, system_key) = 1
  );

create unique index if not exists storefronts_anonymous_session_unique_idx
  on public.storefronts (anonymous_session_id)
  where anonymous_session_id is not null;

create unique index if not exists storefronts_system_key_unique_idx
  on public.storefronts (system_key)
  where system_key is not null;

insert into public.storefronts (
  owner_clerk_user_id,
  anonymous_session_id,
  system_key,
  slug,
  idea,
  content,
  published
)
values (
  null,
  null,
  'homepage-example',
  'example-brooklyn-ember-co',
  'small-batch hot sauce from Brooklyn',
  $$
  {
    "name": "Brooklyn Ember Co.",
    "tagline": "Small-batch heat with a neighborhood soul.",
    "hero": {
      "eyebrow": "Limited runs, big flavor",
      "headline": "Hot sauce that tastes like a block party in a bottle.",
      "body": "Brooklyn Ember Co. turns ripe peppers, roasted garlic, and bright vinegar into a layered sauce for eggs, tacos, noodles, and anything that needs a little swagger."
    },
    "product": {
      "name": "The Borough Blend",
      "description": "A balanced hot sauce built around fermented red jalapenos, charred onion, and a citrus finish. It brings slow-building heat without flattening the food you put it on.",
      "price": "$14",
      "highlights": [
        "Fermented peppers for bright, rounded heat",
        "Hand-bottled in tiny numbered batches",
        "Built for breakfast sandwiches, dumplings, and grilled meats"
      ]
    },
    "theme": {
      "mood": "Urban pantry with sharp contrast and warm accents",
      "palette": {
        "background": "#f7efe5",
        "surface": "#fffaf3",
        "primary": "#b3261e",
        "secondary": "#17324d",
        "accent": "#f2b84b",
        "text": "#171717"
      }
    },
    "cta": {
      "label": "Reserve a bottle",
      "sublabel": "Batch drops are small. Get the next run before it sells out."
    },
    "testimonials": [
      {
        "quote": "It has enough heat to wake everything up, but the flavor is what keeps me reaching for it.",
        "name": "Maya R.",
        "role": "Pop-up chef"
      },
      {
        "quote": "I put it on dumplings once and then quietly rearranged my whole fridge around it.",
        "name": "Jon Bell",
        "role": "Sauce obsessive"
      },
      {
        "quote": "The kind of condiment that makes a weeknight dinner feel designed instead of assembled.",
        "name": "Priya S.",
        "role": "Home cook"
      }
    ]
  }
  $$::jsonb,
  true
)
on conflict (slug) do update
set
  owner_clerk_user_id = null,
  anonymous_session_id = null,
  system_key = excluded.system_key,
  idea = excluded.idea,
  content = excluded.content,
  published = excluded.published;
