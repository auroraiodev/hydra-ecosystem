const NAME_TO_SLUG: Record<string, string> = {
  mtg: 'mtg',
  magic: 'mtg',
  'magic: the gathering': 'mtg',
  pkmn: 'pokemon',
  pokemon: 'pokemon',
  pokémon: 'pokemon',
  'pokémon tcg': 'pokemon',
  'pokemon tcg': 'pokemon',
  yugioh: 'yugioh',
  yugi: 'yugioh',
  'yu-gi-oh': 'yugioh',
  'yu-gi-oh!': 'yugioh',
  'one-piece': 'one-piece',
  'one piece': 'one-piece',
  'one piece cg': 'one-piece',
  accesorios: 'accesorios',
};

/** Maps URL slug → TCG DB name */
const SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(NAME_TO_SLUG).map(([k, v]) => [v, k])
);

export function tcgNameToSlug(name: string): string {
  const key = name.toLowerCase();
  return NAME_TO_SLUG[key] ?? key.replace(/[^a-z0-9]/g, '-');
}

export function tcgSlugToName(slug: string): string {
  return SLUG_TO_NAME[slug.toLowerCase()] ?? slug.toLowerCase();
}

// Note: tcgSearchPath was removed - unused
