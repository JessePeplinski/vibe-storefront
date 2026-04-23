export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

export function buildStorefrontSlug(name: string): string {
  const base = slugify(name) || "storefront";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
