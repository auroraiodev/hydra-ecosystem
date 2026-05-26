import { store } from '@/lib/store';
import { API_URL } from '@/lib/constants/api';

function getAuthHeader() {
  const state = store.getState();
  const token = state.auth.token;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'SALE_PROCEEDS' | 'WITHDRAWAL' | 'PURCHASE';
  description?: string;
  order_id?: string;
  created_at: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export async function getWalletData(): Promise<WalletData> {
  const response = await fetch(`${API_URL}/wallet`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wallet data');
  }

  const result = await response.json();
  return result.success !== undefined ? result.data : result;
}

export async function requestWithdrawal(amount: number, details: string): Promise<unknown> {
  const response = await fetch(`${API_URL}/wallet/withdrawal`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ amount, details }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request withdrawal');
  }

  const result = await response.json();
  return result.success !== undefined ? result.data : result;
}

// Note: PendingPayoutItem, PendingPayoutOrder, getPendingPayouts, requestPayout are unused
// export interface PendingPayoutItem {
//   name: string;
//   imageUrl: string | null;
//   quantity: number;
//   unitPrice: number;
// }

// export interface PendingPayoutOrder {
//   orderId: string;
//   orderStatus: string;
//   createdAt: string;
//   subtotal: number;
//   itemCount: number;
//   items: PendingPayoutItem[];
// }

export interface SellerWalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export async function getSellerWalletData(): Promise<SellerWalletData> {
  const response = await fetch(`${API_URL}/seller/wallet`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch seller wallet data');
  }

  const result = await response.json();
  return result.success !== undefined ? result.data : result;
}

// Note: getPendingPayouts and requestPayout are unused
// export async function getPendingPayouts(): Promise<PendingPayoutOrder[]> {
//   const response = await fetch(`${API_URL}/seller/wallet/pending`, {
//     method: 'GET',
//     headers: getAuthHeader(),
//   });
//
//   if (!response.ok) {
//     throw new Error('Failed to fetch pending payouts');
//   }
//
//   const result = await response.json();
//   return result.success !== undefined ? result.data : result;
// }
//
// export async function requestPayout(orderIds: string[], details: string): Promise<unknown> {
//   const response = await fetch(`${API_URL}/seller/wallet/request-payout`, {
//     method: 'POST',
//     headers: getAuthHeader(),
//     body: JSON.stringify({ orderIds, details }),
//   });
//
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to request payout');
//   }
//
//   const result = await response.json();
//   return result.success !== undefined ? result.data : result;
// }
