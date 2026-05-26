export interface CardData {
  id: string;
  title: string;
  subtitle?: string;
  price: string;
  imageUrl: string;
  grade?: string;
  gradeColor?: string;
  href?: string;
  stock?: number;
  expansion?: string;
  variant?: string;
  cardName?: string;
  condition?: string;
  language?: string;
  immediateDelivery?: boolean;
  isLocalInventory?: boolean;
  foil?: boolean;
  surgeFoil?: boolean;
  cardNumber?: string;
  metadata?: string[];
  images?: string[];
  tags?: string[];
  importationId?: string | null;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
  isBundle?: boolean;
  basePriceJPY?: number;
  finalPrice?: number;
  basePriceMXN?: number;
  importFeeMXN?: number;
  price_mxn_importation?: number;
  price_mxn_local?: number;
  expansionCode?: string;
  isSerialized?: boolean;
  isAlternateFrame?: boolean;
  isShowcase?: boolean;
  category?: string;
  tcg?: string;
  tcgId?: string;
}

export interface EnhancedCardProps {
  card: CardData;
  variant?: 'default' | 'singles' | 'grid';
  className?: string;
  onQuickView?: (card: CardData) => void;
  onCompare?: (card: CardData) => void;
  showWishlist?: boolean;
  showCompare?: boolean;
  showQuickView?: boolean;
  disableAnimation?: boolean;
  priority?: boolean;
}

export interface QuickViewModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface CardActionButtonsProps {
  cardId?: string;
  showWishlist?: boolean;
  showQuickView?: boolean;
  isInWishlist: boolean;
  onWishlistClick: (e: React.MouseEvent) => void;
  onQuickViewClick: (e: React.MouseEvent) => void;
}

export interface CardImageProps {
  imageUrl?: string;
  title: string;
  isBundle?: boolean;
  foil?: boolean;
  aspectRatio?: string;
  imageClassName?: string;
  priority?: boolean;
}

export interface ProductSectionProps {
  title: string;
  subtitle?: string;
  href: string;
  cards: CardData[];
  loading?: boolean;
  error?: string | null;
  onQuickView?: (card: CardData) => void;
  className?: string;
  priority?: boolean;
  icon?: import('lucide-react').LucideIcon;
}

export interface VersionPickerProps {
  productId: string;
  onSelect: (alt: AlternativeVersion) => void;
  className?: string;
}

export interface RecentlyViewedItem {
  id: string;
  title: string;
  imageUrl: string;
  price: string;
  viewedAt: number;
}

// API Types
export interface AlternativeVersion {
  id: string;
  cardName: string;
  name: string;
  expansion: string | null;
  condition: string | null;
  language: string | null;
  foil: boolean;
  surgeFoil?: boolean;
  price: number;
  stock: number;
  imageUrl: string | null;
  importationId: string | null;
  isLocalInventory: boolean;
  variant: string | null;
  cardNumber?: string;
  price_mxn_importation?: number;
  price_mxn_local?: number;
}

export interface Product {
  id: string;
  name?: string;
  cardName?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  img?: string;
  description?: string;
  conditions?: {
    name: string;
    display_name?: string;
  };
  languages?: {
    name: string;
    display_name?: string;
    code?: string;
  };
  categories?: {
    name: string;
    display_name?: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    display_name: string;
  }>;
  expansion?: string;
  variant?: string;
  foil?: boolean;
  surgeFoil?: boolean;
  importationId?: string | null;
  isLocalInventory: boolean;
  metadata?: string[];
  images?: string[];
  price_mxn_importation?: number;
  price_mxn_local?: number;
  expansionCode?: string;
  isSerialized?: boolean;
  isAlternateFrame?: boolean;
  isShowcase?: boolean;
  owner?: {
    username: string;
    avatar_url?: string;
  };
  category?: string;
  tcg?: string;
  tcgId?: string;
}

export * from './ActiveCategories.types';
export * from './ProductDetails.types';
