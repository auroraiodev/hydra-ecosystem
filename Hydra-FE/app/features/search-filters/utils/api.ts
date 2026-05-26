import { API_URL } from '@/lib/constants/api';
import { logger } from '@/lib/utils/logger';
import { SearchResponseSchema } from '@/lib/validations/search';
import type { SearchResponse, SearchLocalParams } from '../types';
import type { CardData } from '@/features/products/types';

/**
 * Search local inventory with optional filters.
 */
export async function searchLocal(
  params: SearchLocalParams,
  options?: { signal?: AbortSignal; revalidate?: number }
): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.paginate != null) searchParams.set('paginate', String(params.paginate));
  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (params.metadata) searchParams.set('metadata', params.metadata);
  if (params.expansion) searchParams.set('expansion', params.expansion);
  if (params.tcgId) searchParams.set('tcgId', params.tcgId);

  // Filters
  if (params.conditions && params.conditions.length > 0) {
    searchParams.set('conditions', params.conditions.join(','));
  }
  if (params.languages && params.languages.length > 0) {
    searchParams.set('languages', params.languages.join(','));
  }
  if (params.foil !== undefined) {
    searchParams.set('foil', String(params.foil));
  }
  if (params.inStock !== undefined) {
    searchParams.set('inStock', String(params.inStock));
  }
  if (params.minPrice != null) {
    searchParams.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice != null) {
    searchParams.set('maxPrice', String(params.maxPrice));
  }

  const url = `${API_URL}/search/local?${searchParams.toString()}`;

  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  };

  if (options?.signal) fetchOptions.signal = options.signal;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    logger.error(`[search/searchLocal] HTTP error! status: ${response.status}`, { url });
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const json = await response.json();

  // Validation - Only in development for performance
  if (process.env.NODE_ENV === 'development') {
    const validation = SearchResponseSchema.safeParse(json);
    if (!validation.success) {
      logger.error('[search/searchLocal] Validation failed', {
        errors: validation.error.format(),
        data: json,
      });
    }
  }

  return json;
}

/**
 * Hybrid search combining local + importation results.
 */
export async function searchHybrid(
  query: string,
  pagination: { page: number; limit: number } = { page: 1, limit: 12 },
  filters: Partial<SearchLocalParams> = {},
  options?: { signal?: AbortSignal; revalidate?: number }
): Promise<SearchResponse> {
  const searchParams = new URLSearchParams({
    q: query,
    page: String(pagination.page),
    limit: String(pagination.limit),
  });

  if (filters.conditions && filters.conditions.length > 0) {
    searchParams.set('conditions', filters.conditions.join(','));
  }
  if (filters.languages && filters.languages.length > 0) {
    searchParams.set('languages', filters.languages.join(','));
  }
  if (filters.foil !== undefined) {
    searchParams.set('foil', String(filters.foil));
  }
  if (filters.inStock !== undefined) {
    searchParams.set('inStock', String(filters.inStock));
  }
  if (filters.minPrice != null) {
    searchParams.set('minPrice', String(filters.minPrice));
  }
  if (filters.maxPrice != null) {
    searchParams.set('maxPrice', String(filters.maxPrice));
  }
  if (filters.tcgId) {
    searchParams.set('tcgId', filters.tcgId);
  }

  const url = `${API_URL}/search/hybrid?${searchParams.toString()}`;

  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  };

  if (options?.signal) fetchOptions.signal = options.signal;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    logger.error(`[search/searchHybrid] HTTP error! status: ${response.status}`, { url });
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const json = await response.json();

  // Validation - Only in development for performance
  if (process.env.NODE_ENV === 'development') {
    const validation = SearchResponseSchema.safeParse(json);
    if (!validation.success) {
      logger.error('[search/searchHybrid] Validation failed', {
        errors: validation.error.format(),
        data: json,
      });
    }
  }

  return json;
}

interface BatchItem {
  id: string;
  name: string;
  cardName?: string;
  finalPrice?: number;
  price?: number | string;
  img?: string;
  imageUrl?: string;
  stock?: number;
  condition_name?: string;
  condition?: { name: string } | string;
  language_name?: string;
  language?: { name: string } | string;
  isLocalInventory?: boolean;
  foil?: boolean;
  surgeFoil?: boolean;
  expansion?: string;
  product_name_en?: string;
  variant?: string;
  hareruyaId?: string;
  cardNumber?: string;
  basePriceMXN?: number;
  importFeeMXN?: number;
}

/**
 * Fetch multiple singles by their IDs (batch endpoint).
 * Used by the wishlist page.
 */
export async function getBatchSingles(ids: string[]): Promise<CardData[]> {
  if (!ids?.length) return [];

  // Split into chunks of 50 (backend limit)
  const chunkSize = 50;
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await fetch(`${API_URL}/singles/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chunk }),
      });

      if (!response.ok) throw new Error('Failed to fetch batch singles');
      const responseData = await response.json();
      return (responseData.data || []) as BatchItem[];
    })
  );

  const items = results.flat();

  return items.map((item: BatchItem) => {
    // Use finalPrice (numeric) if available to avoid parsing formatted strings
    const rawPrice = Number(item.finalPrice ?? (typeof item.price === 'number' ? item.price : 0));

    // If we have a string price but no numeric finalPrice, try to extract numeric value
    let finalRawPrice = rawPrice;
    if (finalRawPrice === 0 && typeof item.price === 'string') {
      const extracted = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(extracted)) finalRawPrice = extracted;
    }

    const formattedPrice =
      finalRawPrice > 0
        ? `$${finalRawPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
        : item.price &&
          typeof item.price === 'string' &&
          item.price.includes('$') &&
          !item.price.includes('0.00') &&
          !item.price.match(/\b0\b/)
          ? item.price
          : 'Consultar';

    const conditionName = item.condition_name
      ? String(item.condition_name)
      : typeof item.condition === 'object' && item.condition !== null && 'name' in item.condition
        ? String(item.condition.name)
        : undefined;

    const languageName = item.language_name
      ? String(item.language_name)
      : typeof item.language === 'object' && item.language !== null && 'name' in item.language
        ? String(item.language.name)
        : undefined;

    return {
      id: String(item.id || ''),
      title: String(item.cardName || item.name || ''),
      cardName: item.cardName ? String(item.cardName) : undefined,
      price: formattedPrice,
      imageUrl: String(item.img || item.imageUrl || '/placeholder-product.png'),
      stock: Number(item.stock ?? 0),
      condition: conditionName,
      language: languageName,
      isLocalInventory: Boolean(item.isLocalInventory),
      foil: Boolean(item.foil),
      surgeFoil: Boolean(item.surgeFoil),
      rating: 0,
      reviewCount: 0,
      href: `/singles/${item.id}`,
      subtitle: item.expansion
        ? String(item.expansion)
        : item.product_name_en
          ? String(item.product_name_en)
          : undefined,
      expansion: item.expansion ? String(item.expansion) : undefined,
      variant: item.variant ? String(item.variant) : undefined,
      hareruyaId: item.hareruyaId ? String(item.hareruyaId) : null,
      cardNumber: item.cardNumber ? String(item.cardNumber) : undefined,
      finalPrice: item.finalPrice ? Number(item.finalPrice) : undefined,
      basePriceMXN: item.basePriceMXN ? Number(item.basePriceMXN) : undefined,
      importFeeMXN: item.importFeeMXN ? Number(item.importFeeMXN) : undefined,
    } as CardData;
  });
}
