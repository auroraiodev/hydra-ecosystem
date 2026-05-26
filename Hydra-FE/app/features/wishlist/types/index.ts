import type { CardData } from '@/features/products/types';

export type WishlistProduct = CardData;

export interface WishlistItemProps {
  product: WishlistProduct;
  onRemove: (id: string, name?: string) => void;
  onAddToCart: (product: WishlistProduct) => Promise<void>;
  isAddingToCart: boolean;
  onVersionSelect: (oldId: string, newProduct: WishlistProduct) => void;
}

export interface WishlistSummaryProps {
  totalItems: number;
  onAddAllToCart: () => Promise<void>;
  isAddingAll: boolean;
}
