export const VALID_TCG_SLUGS = [
  'mtg',
  'magic',
  'pokemon',
  'pkmn',
  'yugioh',
  'accesorios',
  'one-piece',
] as const;

export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  PRECON_DECK: 'Precons',
  BUNDLE: 'Bundles',
  Bundle: 'Bundles',
  SINGLES: 'Singles',
  MICAS: 'Micas y Accesorios',
};

// Note: DEFAULT_PAGE_SIZE was removed - unused
