import type { SearchResult } from '@/lib/types';
import type { HybridSearchResult } from '@/features/singles-search/types';
import type { CardData } from '@/features/products/types/EnhancedCard.types';
import { resolveImageUrl } from './imageUrl';

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
  ENGLISH: 'Inglés',
  SPANISH: 'Español',
  JAPANESE: 'Japonés',
};

/**
 * Resolves a language value (raw Hareruya code, abbreviation, or display name) to its
 * Spanish display name. Returns the input unchanged if it's already a known display name.
 */
export function resolveLanguageName(lang: string | number | null | undefined): string | undefined {
  if (lang == null || lang === '') return undefined;
  const sLang = String(lang).trim();
  return RAW_LANGUAGE_DISPLAY[sLang] ?? RAW_LANGUAGE_DISPLAY[sLang.toUpperCase()] ?? sLang;
}

/**
 * Resolves a language display name or abbreviation to its raw Hareruya numeric code.
 * Defaults to '2' (English) if unknown.
 */
export function resolveLanguageCode(lang: string | null | undefined): string {
  if (!lang) return '2';

  // If it's already a numeric string, return it
  if (/^\d+$/.test(lang)) return lang;

  const normalized = lang.toLowerCase().trim();

  const mapping: Record<string, string> = {
    inglés: '2',
    ingles: '2',
    en: '2',
    english: '2',
    japonés: '1',
    japones: '1',
    jp: '1',
    japanese: '1',
    español: '11',
    espanol: '11',
    es: '11',
    spanish: '11',
    francés: '3',
    frances: '3',
    fr: '3',
    french: '3',
    alemán: '6',
    aleman: '6',
    de: '6',
    german: '6',
    italiano: '7',
    it: '7',
    italian: '7',
    coreano: '8',
    ko: '8',
    korean: '8',
    portugués: '9',
    portugues: '9',
    pt: '9',
    portuguese: '9',
    ruso: '10',
    ru: '10',
    russian: '10',
    chino: '4',
    zh: '4',
    chinese: '4',
  };

  return mapping[normalized] ?? '2';
}

/** Normalizes any price value (number or string) to "$X.XX MXN", e.g. "$543.38 MXN" */
export function normalizePrice(value: string | number | null | undefined): string {
  if (value == null || value === '') return '';
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(n) || n <= 0) return '';
  return `$${parseFloat(n.toFixed(2)).toString()} MXN`;
}

const BUNDLE_CATEGORIES = new Set([
  'PRECON_DECK',
  'CONSTRUCTED_DECK',
  'BUNDLE',
  'BOOSTER_BOX',
  'SEALED',
  'Bundle',
]);

interface TransformOptions {
  /** Suffix appended to generated IDs to avoid key collisions (e.g. "commander", "bundle") */
  suffix?: string;
  /** Force isBundle to this value instead of auto-detecting */
  forceBundle?: boolean;
  /** Force immediateDelivery to true (for sealed products) */
  forceImmediate?: boolean;
}

/**
 * Normalize tags from mixed string[] | { name: string }[] to string[].
 */
function normalizeTags(tags: SearchResult['tags']): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.flatMap((t: string | { name: string }) => {
    const val = typeof t === 'string' ? t : t?.name || '';
    return val ? [val] : [];
  });
}

/**
 * Transform a SearchResult into a CardData object for rendering.
 */
function searchResultToCardData(
  result: SearchResult | HybridSearchResult,
  index: number,
  options: TransformOptions = {}
): CardData {
  const { suffix, forceBundle, forceImmediate } = options;

  const isBundle =
    forceBundle ??
    (BUNDLE_CATEGORIES.has(result.category) || result.metadata?.includes('Bundle') || false);

  const realId = result.id;
  const productId =
    realId || `${result.importationId}-${result.language}${suffix ? `-${suffix}` : ''}-${index}`;

  const immediateDelivery =
    forceImmediate != null
      ? result.isLocalInventory || forceImmediate
      : result.isLocalInventory || isBundle;

  // Resolve numeric price — price can arrive as number or formatted string
  const rawPrice = result.price;
  const parsedStrPrice =
    typeof rawPrice === 'number' ? rawPrice : parseFloat((rawPrice ?? '').replace(/[^0-9.]/g, ''));
  const hResult = result as HybridSearchResult;
  const numericPrice =
    !isNaN(parsedStrPrice) && parsedStrPrice > 0
      ? parsedStrPrice
      : result.finalPrice != null && result.finalPrice > 0
        ? result.finalPrice
        : hResult.price_mxn_local != null && hResult.price_mxn_local > 0
          ? hResult.price_mxn_local
          : hResult.price_mxn_importation != null && hResult.price_mxn_importation > 0
            ? hResult.price_mxn_importation
            : null;

  const href = realId
    ? `/singles/${realId}`
    : result.importationId
      ? `/singles/${result.importationId}`
      : undefined;

  return {
    id: productId,
    title: result.cardName,
    cardName: result.cardName,
    price: normalizePrice(numericPrice ?? rawPrice),
    imageUrl: resolveImageUrl(
      result.img || (result.images && result.images.length > 0 ? result.images[0] : '')
    ),
    stock: result.stock,
    expansion: result.expansion,
    variant: result.variant,
    condition: result.condition,
    language: resolveLanguageName(result.language),
    immediateDelivery,
    isLocalInventory: immediateDelivery,
    foil: result.foil,
    cardNumber: result.cardNumber,
    metadata: result.metadata,
    images: result.images || [],
    tags: normalizeTags(result.tags),
    importationId: result.importationId || null,
    category: result.category,
    tcg: result.tcg,
    tcgId: result.tcgId,
    href,
    isBundle,
    price_mxn_local: hResult.price_mxn_local,
    price_mxn_importation: hResult.price_mxn_importation,
    soldBy: result.soldBy || result.store?.name || result.seller?.name,
    storeLogo: resolveImageUrl(
      result.storeLogo || result.store?.logo_url || result.seller?.logo_url
    ),
  };
}

/**
 * Transform an array of SearchResults into CardData[].
 * Convenience wrapper for use in useMemo blocks.
 */
export function searchResultsToCardData(
  results: SearchResult[],
  options: TransformOptions = {}
): CardData[] {
  return results.map((result, index) => searchResultToCardData(result, index, options));
}
