

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchRoute?: string;
  extraParams?: Record<string, string>;
}










type SearchType = 'singles' | 'general';

export interface UseAutocompleteOptions {
  searchType?: SearchType;
  enabled?: boolean;
}

// API Response Types
export interface SearchResult {
  id?: string;
  borderless: boolean;
  cardName: string;
  cardNumber: string;
  category: string;
  condition: string;
  expansion: string;
  extendedArt: boolean;
  finalPrice: number;
  foil: boolean;
  importationId: string;
  img: string;
  images?: string[];
  isLocalInventory: boolean;
  language: string;
  link: string;
  metadata: string[];
  prerelease: boolean;
  premierPlay: boolean;
  price: string;
  originalPrice?: string;
  stock: number;
  surgeFoil: boolean;
  tags: string[] | Array<{ name: string }>;
  variant: string;
  basePriceJPY?: number;
  basePriceMXN?: number;
  importFeeMXN?: number;
  tcg?: string;
  tcgId?: string;
  soldBy?: string;
  storeLogo?: string;
  store?: {
    name: string;
    logo_url?: string;
  };
  seller?: {
    name: string;
    logo_url?: string;
  };
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  localCount: number;
  importationCount?: number;
  updatedPrices?: number;
  pagination?: SearchPagination;
}

export interface SearchLocalParams {
  limit?: number;
  page?: number;
  paginate?: boolean;
  q?: string;
  category?: string;
  metadata?: string;
  expansion?: string;
  tcgId?: string;
  conditions?: string[];
  languages?: string[];
  foil?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
