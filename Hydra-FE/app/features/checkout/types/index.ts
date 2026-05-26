import type { Address } from '@/lib/api/users';
import type { ReactElement } from 'react';
import type { CartItem, CartSummaryResponse } from '@/features/cart';

export interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  isLoadingAddresses: boolean;
  isAddingAddress: boolean;
  setIsAddingAddress: (isAdding: boolean) => void;
  newAddress: Partial<Address>;
  setNewAddress: (
    address: Partial<Address> | ((prev: Partial<Address>) => Partial<Address>)
  ) => void;
  handleAddAddress: () => void;
  userName: string | null;
}

interface OrderSummaryItem {
  id: string;
  imageUrl?: string;
  title: string;
  cardName?: string;
  quantity: number;
  condition?: string;
  isBundle?: boolean;
  isImportation?: boolean;
  immediateDelivery?: boolean;
  isLocalInventory?: boolean;
  metadata?: string | string[];
  price: number | string;
  foil?: boolean;
  outOfStock?: boolean;
  stock?: number | null;
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[];
  totalItems: number;
  totalPrice: number;
  shippingMethod: 'shipping' | 'arrange';
  shippingCost: number;
  finalTotal: number;
  formatPrice: (price: number | string) => ReactElement;
  selectedItemIds?: string[];
  onToggleItem?: (id: string) => void;
  onToggleAll?: (selected: boolean) => void;
}

export interface OrderSummaryItemRowProps {
  item: OrderSummaryItem;
  isSelected: boolean;
  onToggleItem?: (id: string) => void;
  formatPrice: (price: number | string) => ReactElement;
}

export type PaymentMethod = 'transfer' | 'mercadopago' | 'wallet';

export interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  balance: number | null;
  finalTotal: number;
  isMpDisabled: boolean;
  MP_MINIMUM_AMOUNT: number;
}

export interface PaymentMethodOptionProps {
  id: PaymentMethod;
  name: string;
  subtitle: string;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (id: PaymentMethod) => void;
  theme: 'light' | 'dark';
}

export type ShippingMethod = 'shipping' | 'arrange';

export interface ShippingMethodSelectorProps {
  shippingMethod: ShippingMethod;
  setShippingMethod: (method: ShippingMethod) => void;
}

export interface UseCheckoutReturn {
  // State
  items: CartItem[];
  isLoading: boolean;
  isLoaded: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  shippingMethod: ShippingMethod;
  setShippingMethod: (method: ShippingMethod) => void;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  isAddingAddress: boolean;
  setIsAddingAddress: (isAdding: boolean) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  balance: number | null;
  showImportWarning: boolean;
  setShowImportWarning: (show: boolean) => void;
  selectedItemIds: string[];
  isProcessing: boolean;
  backendTotals: CartSummaryResponse['data'] | null;
  summaryError: boolean;
  isFetchingTotals: boolean;
  mobileStep: number;
  setMobileStep: (step: number | ((s: number) => number)) => void;
  newAddress: Partial<Address>;
  setNewAddress: (
    address: Partial<Address> | ((prev: Partial<Address>) => Partial<Address>)
  ) => void;

  // Computed
  userName: string | null;
  totalPrice: number;
  totalItems: number;
  shippingCost: number;
  finalTotal: number;
  hasImportItems: boolean;
  isMpDisabled: boolean;
  hasOutOfStockSelected: boolean;
  selectedItems: CartItem[];

  // Handlers
  handleAddAddress: () => Promise<void>;
  handleCheckoutClick: () => void;
  handleCheckout: () => Promise<void>;
  handleMobileShippingSelect: (method: ShippingMethod) => void;
  handleMobileAddressSelect: (id: string) => void;
  toggleItemSelection: (id: string) => void;
  toggleAllSelection: (selected: boolean) => void;
  formatPrice: (price: string | number) => ReactElement;
}
export interface ImportWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
