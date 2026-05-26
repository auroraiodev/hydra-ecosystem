import { API_URL } from '../constants/api';
import { logger } from '../utils/logger';
import { OrderResponseSchema } from '../validations/order';
import { tokenStore } from '../utils/tokenStore';

export enum PaymentMethod {
  TRANSFER = 'transfer',
  MERCADOPAGO = 'mercadopago',
  WALLET = 'wallet',
  GOOGLEPAY = 'googlepay',
  WALLET_PLUS_MERCADOPAGO = 'wallet_plus_mercadopago',
  WALLET_PLUS_TRANSFER = 'wallet_plus_transfer',
}

export enum ShippingMethod {
  ARRANGE = 'arrange',
  SHIPPING = 'shipping',
}

export interface CreateOrderRequest {
  shippingMethod: ShippingMethod;
  addressId?: string;
  phoneNumber?: string;
  paymentMethod: PaymentMethod;
  paymentToken?: string;
  /** Amount to pay from wallet balance (required for wallet_plus_mercadopago / wallet_plus_transfer) */
  walletAmount?: number;
  /** List of cart item IDs to include in the order */
  itemIds?: string[];
}

export interface OrderItem {
  id: string;
  singleId?: string;
  importationId?: string;
  quantity: number;
  unitPrice: string;
  productData?: Record<string, unknown>;
  isDelivered?: boolean;
}

interface OrderShipping {
  id: string;
  shippingMethod: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    receiverName?: string;
  };
}

interface Payment {
  id: string;
  paymentMethod: string;
  mercadopagoPaymentId?: string;
  mercadopagoPreferenceId?: string;
  status: string;
  paymentData?: Record<string, unknown>;
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  importationItems: OrderItem[];
  shipping?: OrderShipping;
  payment?: Payment;
  total: string;
  subtotal?: string;
  shippingCost?: string;
  importFee?: string;
  paymentServiceFee?: string;
  /** Amount paid from wallet balance (for wallet_plus_* payment methods) */
  walletApplied?: string;
  /** Amount still owed via card/transfer (for wallet_plus_* payment methods) */
  remainingToPay?: string;
  estimatedDeliveryAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  importOrderedAt?: string;
  review_requested?: boolean;
  has_review?: boolean;
  internalOrderNumber?: string;
  trackingEntries?: { date: string; time: string; origin: string; event: string }[];
}

interface CreateOrderResponse {
  order: OrderResponse;
  payment: {
    paymentId: string;
    preferenceId?: string;
    initPoint?: string;
    paymentMethod?: string;
  };
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = tokenStore.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Create order from cart
 */
export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_URL}/orders/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch((err) => {
      logger.error('[orders/createOrder] JSON parse error', { error: err });
      return { message: 'Failed to create order' };
    });
    throw new Error(error.message || 'Failed to create order');
  }

  const json = await response.json();
  if (json.success && json.data) {
    return json.data;
  }
  return json;
}

// @knip-ignore - unused export kept for reference
// /**
//  * Get checkout totals without creating an order
//  */
// export async function getCheckoutTotals(
//   data: CheckoutTotalsRequest
// ): Promise<CheckoutTotalsResponse> {
//   const response = await fetch(`${API_URL}/orders/checkout/totals`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(data),
//   });
//
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({ message: 'Failed to get checkout totals' }));
//     throw new Error(error.message || 'Failed to get checkout totals');
//   }
//
//   const json = await response.json();
//   if (json.success && json.data) {
//     return json.data;
//   }
//   return json;
// }

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch((err) => {
      logger.error('[orders/getOrder] JSON parse error', { error: err });
      return { message: 'Failed to get order' };
    });
    throw new Error(error.message || 'Failed to get order');
  }

  const json = await response.json();
  const data = json.success && json.data ? json.data : json;

  // Validation
  const validation = OrderResponseSchema.safeParse(data);
  if (!validation.success) {
    logger.error('[orders/getOrder] Validation failed', {
      errors: validation.error.format(),
      data,
    });
  }

  return data;
}

/**
 * Get all orders for current user
 */
export async function getUserOrders(): Promise<OrderResponse[]> {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to get orders',
    }));
    throw new Error(error.message || 'Failed to get orders');
  }

  const json = await response.json();
  if (json.success && json.data) {
    return json.data;
  }
  return json;
}

// @knip-ignore - unused export kept for reference
// /**
//  * Update order
//  */
// export interface UpdateOrderRequest {
//   status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
// }
//
// export async function updateOrder(
//   orderId: string,
//   data: UpdateOrderRequest
// ): Promise<OrderResponse> {
//   const response = await fetch(`${API_URL}/orders/${orderId}`, {
//     method: 'PATCH',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(data),
//   });
//
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({
//       message: 'Failed to update order',
//     }));
//     throw new Error(error.message || 'Failed to update order');
//   }
//
//   const json = await response.json();
//   if (json.success && json.data) {
//     return json.data;
//   }
//   return json;
// }
//
// /**
//  * Delete order
//  */
// export async function deleteOrder(orderId: string): Promise<void> {
//   const response = await fetch(`${API_URL}/orders/${orderId}`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(),
//   });
//
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({
//       message: 'Failed to delete order',
//     }));
//     throw new Error(error.message || 'Failed to delete order');
//   }
// }

/**
 * Pay order with wallet
 */
export async function payWithWallet(orderId: string): Promise<void> {
  const response = await fetch(`${API_URL}/orders/${orderId}/pay-with-wallet`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to pay with wallet',
    }));
    throw new Error(error.message || 'Failed to pay with wallet');
  }
}

/**
 * Create a Mercado Pago preference for an existing PENDING order
 * (e.g. user chose transfer but wants to pay via MP instead)
 */
export async function payWithMercadoPago(
  orderId: string
): Promise<{ preferenceId: string; initPoint: string }> {
  const response = await fetch(`${API_URL}/orders/${orderId}/pay-with-mercadopago`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Failed to create MP preference' }));
    throw new Error(error.message || 'Failed to create MP preference');
  }

  const json = await response.json();
  if (json.success && json.data) return json.data;
  return json;
}

// @knip-ignore - unused export kept for reference
// /**
//  * Get all orders (admin)
//  */
// export interface AdminOrdersParams {
//   status?: string;
//   page?: number;
//   limit?: number;
//   search?: string;
// }
//
// export async function getAdminOrders(
//   params: AdminOrdersParams = {}
// ): Promise<{ orders: OrderResponse[]; total: number; page: number; limit: number }> {
//   const query = new URLSearchParams();
//   if (params.status) query.set('status', params.status);
//   if (params.page) query.set('page', String(params.page));
//   if (params.limit) query.set('limit', String(params.limit));
//   if (params.search) query.set('search', params.search);
//
//   const response = await fetch(`${API_URL}/admin/orders?${query.toString()}`, {
//     method: 'GET',
//     headers: getAuthHeaders(),
//   });
//
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({ message: 'Failed to get admin orders' }));
//     throw new Error(error.message || 'Failed to get admin orders');
//   }
//
//   const json = await response.json();
//   if (json.success && json.data) return json.data;
//   return json;
// }
//
// /**
//  * Mark an order item (local or importation) as delivered/ordered
//  */
// export async function updateItemDeliveryStatus(
//   orderId: string,
//   itemId: string,
//   isDelivered: boolean
// ): Promise<OrderResponse> {
//   const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}/delivery-status`, {
//     method: 'PATCH',
//     headers: getAuthHeaders(),
//     body: JSON.stringify({ isDelivered }),
//   });
//
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({ message: 'Failed to update item status' }));
//     throw new Error(error.message || 'Failed to update item status');
//   }
//
//   const json = await response.json();
//   if (json.success && json.data) return json.data;
//   return json;
// }
