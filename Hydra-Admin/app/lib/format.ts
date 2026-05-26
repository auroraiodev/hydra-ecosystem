/** Maps raw Hareruya language codes and language abbreviations to Spanish display names. */
const RAW_LANGUAGE_DISPLAY: Record<string, string> = {
  '1': 'Japonés',
  '2': 'Inglés',
  '3': 'Francés',
  '4': 'Chino',
  '5': 'Francés',
  '6': 'Alemán',
  '7': 'Italiano',
  '8': 'Coreano',
  '9': 'Portugués',
  '10': 'Ruso',
  '11': 'Español',
  '12': 'Inglés',
  EN: 'Inglés',
  JP: 'Japonés',
  ES: 'Español',
  FR: 'Francés',
  DE: 'Alemán',
  IT: 'Italiano',
  KO: 'Coreano',
  PT: 'Portugués',
  ZH: 'Chino',
  RU: 'Ruso',
};

/**
 * Resolves a language value (raw Hareruya code, abbreviation, or display name) to its
 * Spanish display name.
 */
export function resolveLanguageName(lang: string | null | undefined): string | undefined {
  if (!lang) return undefined;
  return RAW_LANGUAGE_DISPLAY[lang] ?? RAW_LANGUAGE_DISPLAY[lang.toUpperCase()] ?? lang;
}
