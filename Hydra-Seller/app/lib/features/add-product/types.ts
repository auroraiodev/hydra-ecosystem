export interface AddProductData {
  // Basic product info
  name: string;
  title: string;
  description?: string;
  price: number;
  cost?: number;
  imageUrl: string;
  imageUrls: string[];

  // Category
  categoryId: string;
  category?: string;
  subcategory?: string;
  brand?: string;

  // Stock information
  inStock: number;
  stockStatus: string;
  stockNumber?: string;

  // Ownership
  owner?: {
    type: string;
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
  };
  tags: string[];
  consignmentItem: boolean;
  commissionRate: number;

  // Game system specific fields
  gameSystem?: string;
  expansion?: string;
  expansionCode?: string;
  setName?: string;
  conditionId?: string;
  rarityId?: string;
  languageId?: string;
  cardNumber?: string;
  artist?: string;
  manaCost?: string;
  power?: string;
  toughness?: string;
  isFoil?: boolean;
  isBorderless?: boolean;
  isPromo?: boolean;
  surgeFoil?: boolean;
  extendedArt?: boolean;
  prerelease?: boolean;
  premierPlay?: boolean;
  variant?: string;

  // Importation specific fields
  importationId?: string;
  importationProductId?: string;
  importationLink?: string;
  importationPrice?: number;
  language?: string;
  languageCode?: string;
  backupLanguage?: string;
  condition?: string;

  // Bundle specific
  contents?: string[];

  // Booster box specific
  boosterCount?: number;

  // Sleeves specific
  color?: string;
  quantity?: number;

  // Deck specific
  format?: string;
  cardList?: string[];

  // TCG association
  tcgId?: string;

  // Bulk import pending state
  _isPending?: boolean;
  _bulkImportId?: string; // Unique ID for tracking in bulk import
}

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  productCommissionRate?: number;
}

export interface Category {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  image_url?: string;
  form_config?: unknown;
}

export interface Tcg {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  logo_url?: string;
  icon_url?: string;
}

export interface Condition {
  id: string;
  name: string;
  displayName?: string;
  code?: string;
}

export interface Language {
  id: string;
  name: string;
  displayName?: string;
}

export interface Rarity {
  id: string;
  name: string;
  displayName?: string;
}

export interface ImportationCard {
  id?: string;
  productId?: string;
  importationId?: string;
  name?: string;
  title?: string;
  cardName?: string;
  expansion?: string;
  expansionCode?: string;
  set?: string;
  setName?: string;
  imageUrl?: string;
  img?: string;
  price?: number;
  finalPrice?: number;
  importationPrice?: number;
  formattedPrice?: string;
  language?: string;
  condition?: string;
  isFoil?: boolean;
  bulkIsFoil?: boolean;
  foil?: boolean;
  borderless?: boolean;
  isBorderless?: boolean;
  surgeFoil?: boolean;
  extendedArt?: boolean;
  prerelease?: boolean;
  premierPlay?: boolean;
  rarity?: string;
  cardNumber?: string;
  artist?: string;
  link?: string;
  variant?: string;
  tags?: string[];
  images?: string[];
  setCode?: string;
}

export interface AddProductState {
  selectedOwner: User | null;
  selectedCategory: Category | null;
  selectedTcg: Tcg | null;
  items: AddProductData[];
  loading: boolean;
  error: string | null;
  currentStep: number;
  isSubmitting: boolean;
  owners: User[];
  categories: Category[];
  tcgs: Tcg[];
  conditions: Condition[];
  rarities: Rarity[];
  languages: Language[];
  importationSearchResults: ImportationCard[];
  isSearchingImportation: boolean;
  isAdmin: boolean;
  importationFilters: ImportationSearchFilters;
  validationErrors: Record<string, string>;
}

export interface ImportationSearchFilters {
  language?: string;
  condition?: string;
  foil?: boolean;
  sort?: string;
  includeOutOfStock?: boolean;
}

export interface AddProductActions {
  addItem: (item: AddProductData) => void;
  addItems: (items: AddProductData[]) => void;
  addPendingItem: (item: AddProductData) => void;
  updateItem: (index: number, item: Partial<AddProductData>) => void;
  removeItem: (index: number) => void;
  clearAllItems: () => void;
  setSelectedOwner: (owner: User | null) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedTcg: (tcg: Tcg | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: number) => void;
  setIsSubmitting: (submitting: boolean) => void;
  loadOwners: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTcgs: () => Promise<void>;
  loadConditions: () => Promise<void>;
  loadRarities: () => Promise<void>;
  loadLanguages: () => Promise<void>;
  searchImportation: (query: string, filters?: ImportationSearchFilters) => void;
  setImportationFilters: (filters: ImportationSearchFilters) => void;
  selectImportationCard: (card: ImportationCard) => void;
  validateForm: () => boolean;
  setValidationError: (field: string, error: string) => void;
  clearValidationErrors: () => void;
  submitProducts: () => Promise<boolean>;
  resetForm: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

export interface OwnerSelectorProps {
  selectedOwner: User | null;
  owners: User[];
  onSelect: (owner: User | null) => void;
  loading: boolean;
}

export interface ItemsListProps {
  items: AddProductData[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: Partial<AddProductData>) => void;
  onClearAll?: () => void;
  selectedOwner: User | null;
  selectedCategory: Category | null;
  loading: boolean;
}
