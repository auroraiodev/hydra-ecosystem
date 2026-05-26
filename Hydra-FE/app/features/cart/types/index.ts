import type { CardData } from '@/features/products/types';

export interface CartItem extends CardData {
  quantity: number;
  addedAt?: number; // timestamp (optional for API items)
  cartItemId?: string; // ID from backend cart_items table
  isImportation?: boolean; // true if product is from importation
  importationId?: string | null; // Importation product ID
  singleId?: string | null; // Local product ID
}

export interface Cart {
  items: CartItem[];
  updatedAt: number; // timestamp
}

// API Response Types
export interface CartItemResponse {
  id: string;
  quantity: number;
  isImportation: boolean;
  importationId?: string | null;
  singleId?: string | null;
  productData: CardData;
}

export interface CartResponse {
  success: boolean;
  data: CartItemResponse[];
}

export interface AddCartItemRequest {
  singleId?: string;
  quantity: number;
  isImportation: boolean;
  importationId?: string;
  productData?: Record<string, unknown>; // Optional: required only for importation products
  tcgId?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartSummaryResponse {
  success: boolean;
  data: {
    items: {
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      stock: number | null;
      outOfStock: boolean;
    }[];
    subtotal: number;
    shippingCost: number;
    total: number;
    itemCount: number;
    hasImportItems: boolean;
  };
}
