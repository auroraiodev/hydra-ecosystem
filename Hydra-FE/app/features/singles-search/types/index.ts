import type { SearchResult, SearchPagination } from '@/lib/types';

export type { SearchPagination };

export type HybridSearchResult = Omit<SearchResult, 'tags'> & {
  tags: string[];
  basePriceJPY?: number;
  basePriceMXN?: number;
  importFeeMXN?: number;
  price_mxn_importation?: number;
  price_mxn_local?: number;
  expansionCode?: string;
  isSerialized?: boolean;
  isAlternateFrame?: boolean;
  isShowcase?: boolean;
};

export interface HybridSearchResponse {
  success: boolean;
  data: HybridSearchResult[];
  localCount: number;
  importationCount: number;
  updatedPrices: number;
  pagination?: SearchPagination;
}

export interface SinglesSearchProps {
  forcedExpansion?: string;
  category?: string;
  tcgId?: string;
  tcgSlug?: string;
  initialResults?: HybridSearchResult[];
  initialPagination?: SearchPagination | null;
}

export interface SearchDataLoaderProps {
  query?: string;
  category?: string;
  expansion?: string;
  metadata?: string;
  tcgId?: string;
  tcgSlug?: string;
  isLocal: boolean;
  page: number;
}
