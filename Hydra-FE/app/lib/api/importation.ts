import { API_URL } from '@/lib/constants/api';

export interface ImportationVariant {
  productId: string;
  realProductId: string;
  name: string;
  title: string;
  price: number;
  currency: 'JPY';
  price_mxn_importation: number;
  price_mxn_local: number;
  stock: number;
  condition: string;
  language: string;
  imageUrl?: string;
  isFoil: boolean;
  expansionCode?: string;
  cardNumber?: string;
  set?: string | null;
}

export interface ImportationSearchResponse {
  success: boolean;
  data: ImportationSearchItem[];
  pagination: {
    totalItems: number;
    currentPage: number;
    maxPage: number;
    hasNextPage: boolean;
    itemsPerPage: number;
  };
}

export interface ImportationSearchItem {
  importationId: string;
  cardName: string;
  cardNumber?: string;
  expansion?: string;
  expansionCode?: string;
  language: string;
  price: string;
  finalPrice: number;
  price_mxn_importation: number;
  price_mxn_local: number;
  img?: string;
  stock: number;
  foil: boolean;
  surgeFoil?: boolean;
  isSerialized?: boolean;
  isShowcase?: boolean;
  isAlternateFrame?: boolean;
  source: 'importation';
  isLocalInventory: false;
}

export async function searchImportation(
  cardName: string,
  options: {
    page?: number;
    rows?: number;
    language?: string;
    foil?: boolean;
    sort?: string;
    includeOutOfStock?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<ImportationSearchResponse> {
  const params = new URLSearchParams({ q: cardName });
  if (options.page) params.set('page', String(options.page));
  if (options.rows) params.set('rows', String(options.rows));
  if (options.language) params.set('language', options.language);
  if (options.foil !== undefined) params.set('foil', String(options.foil));
  if (options.sort) params.set('sort', options.sort);
  if (options.includeOutOfStock) params.set('includeOutOfStock', 'true');

  const res = await fetch(`${API_URL}/importation/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Importation search failed: ${res.status}`);
  return res.json();
}

export async function getImportationPrice(
  importationId: string,
  cardName: string,
  isFoil: boolean,
  language: string
): Promise<ImportationVariant | null> {
  const params = new URLSearchParams({
    importationId,
    cardName,
    isFoil: String(isFoil),
    language,
  });

  try {
    const res = await fetch(`${API_URL}/importation/price?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) || null;
  } catch {
    return null;
  }
}
