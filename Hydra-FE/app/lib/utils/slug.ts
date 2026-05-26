/**
 * Generates a URL-friendly slug from a string.
 * Normalizes accents, removes special characters, and replaces spaces with dashes.
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Split accents from characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/-+/g, '-'); // Replace multiple dashes with single dash
}

/**
 * Generates the full canonical path for a product.
 */
export function getProductCanonicalPath(id: string, name?: string): string {
  const slug = name ? generateSlug(name) : '';
  return `/singles/${id}${slug ? `-${slug}` : ''}`;
}
