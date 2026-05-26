// User types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'seller' | 'client';
  status: 'active' | 'inactive';
  joinDate: string;
}

// Product types
interface Product {
  id: string;
  name: string;
  cardSet: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  price: number;
  stock: number;
  condition: 'mint' | 'near-mint' | 'lightly-played' | 'moderately-played' | string;
  image?: string;
  language?: string;
  isFoil?: boolean;
  importationId?: string;
  cardNumber?: string;
  isLocalInventory?: boolean;
  originLabel?: string;
}

// Order types
export interface OrderItem {
  id: string;
  productId?: string;
  productName?: string; // Legacy - prefer product.name
  quantity: number;
  price: number;
  unitPrice: number;
  totalPrice: number;
  isDelivered?: boolean;
  deliveryStatus?: 'pending' | 'importing' | 'sold' | 'partial' | string;
  isLocalInventory?: boolean;
  product?: Product; // Product relation with all details
}

export interface Order {
  id: string;
  orderNumber: string;
  user?: User; // User relation for customer data
  customer?: string; // Legacy - prefer user relation
  email?: string; // Legacy - prefer user.email
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  total: number;
  items: OrderItem[];
  orderDate: string;
  shippingDate?: string;
  deliveryLocationId?: string; // UUID
  deliveryPointId?: string; // UUID
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
