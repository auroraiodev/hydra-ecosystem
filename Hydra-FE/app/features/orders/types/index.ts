import type { OrderResponse, OrderItem } from '@/lib/api/orders';

export type { OrderItem };

export interface OrderCardProps {
  order: OrderResponse;
}

export interface OrderTimelineProps {
  order: OrderResponse;
}

export interface OrderInfoCardsProps {
  order: OrderResponse;
}

export interface OrderItemsProps {
  items: OrderItem[];
  importationItems: OrderItem[];
  formatPrice: (price: string | number) => string;
}

export interface OrderSidebarSummaryProps {
  order: OrderResponse;
  balance: number | null;
  isProcessing: boolean;
  onPayWithWallet: () => void;
  onPayWithMercadoPago: () => void;
  formatPrice: (price: string | number) => string;
}
