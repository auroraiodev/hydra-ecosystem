export interface OrderItem {
  id: string;
  productId?: string;
  quantity: number;
  price: number;
  unitPrice: number;
  totalPrice: number;
  isDelivered?: boolean;
  deliveryStatus?: 'pending' | 'importing' | 'sold' | 'partial' | string;
  isLocalInventory?: boolean;
  product?: {
    id?: string;
    name?: string;
    image?: string;
    cardNumber?: string;
    cardSet?: string;
    originLabel?: string;
    language?: string;
    isFoil?: boolean;
    condition?: string;
    importationId?: string;
    isLocalInventory?: boolean;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    joinDate?: string;
  };
  customer?: string;
  email?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  total: number;
  items: OrderItem[];
  orderDate: string;
  shippingDate?: string;
  deliveryLocationId?: string;
  deliveryPointId?: string;
  importFee?: number;
  paymentServiceFee?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  estimatedDeliveryAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  importOrderedAt?: string;
  reviewRequested?: boolean;
  internalOrderNumber?: string;
  notes?: string;
  trackingEntries?: { date: string; time: string; origin: string; event: string }[];
}
