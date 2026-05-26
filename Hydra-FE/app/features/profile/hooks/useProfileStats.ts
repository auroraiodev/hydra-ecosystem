import { useEffect, useReducer } from 'react';
import { getUserOrders } from '@/lib/api/orders';
import { getMyListings } from '@/lib/api/listings';
import { getWalletData } from '@/lib/api/wallet';

interface ProfileStatsState {
  ordersCount: number | null;
  isLoadingOrders: boolean;
  listingsCount: number | null;
  isLoadingListings: boolean;
  balance: number | null;
  isLoadingBalance: boolean;
}

type ProfileStatsAction =
  | { type: 'FETCH_ORDERS_START' }
  | { type: 'FETCH_ORDERS_SUCCESS'; payload: number }
  | { type: 'FETCH_LISTINGS_START' }
  | { type: 'FETCH_LISTINGS_SUCCESS'; payload: number }
  | { type: 'FETCH_BALANCE_START' }
  | { type: 'FETCH_BALANCE_SUCCESS'; payload: number };

function profileStatsReducer(
  state: ProfileStatsState,
  action: ProfileStatsAction
): ProfileStatsState {
  switch (action.type) {
    case 'FETCH_ORDERS_START':
      return { ...state, isLoadingOrders: true };
    case 'FETCH_ORDERS_SUCCESS':
      return { ...state, ordersCount: action.payload, isLoadingOrders: false };
    case 'FETCH_LISTINGS_START':
      return { ...state, isLoadingListings: true };
    case 'FETCH_LISTINGS_SUCCESS':
      return { ...state, listingsCount: action.payload, isLoadingListings: false };
    case 'FETCH_BALANCE_START':
      return { ...state, isLoadingBalance: true };
    case 'FETCH_BALANCE_SUCCESS':
      return { ...state, balance: action.payload, isLoadingBalance: false };
    default:
      return state;
  }
}

const initialProfileStats: ProfileStatsState = {
  ordersCount: null,
  isLoadingOrders: false,
  listingsCount: null,
  isLoadingListings: false,
  balance: null,
  isLoadingBalance: false,
};

export function useProfileStats(
  isAuthenticated: boolean,
  options?: {
    fetchOrders?: boolean;
    fetchListings?: boolean;
    fetchBalance?: boolean;
  }
) {
  const { fetchOrders = true, fetchListings = true, fetchBalance = true } = options || {};
  const [stats, dispatch] = useReducer(profileStatsReducer, initialProfileStats);

  useEffect(() => {
    async function fetchOrdersCount() {
      if (!isAuthenticated || !fetchOrders) return;
      try {
        dispatch({ type: 'FETCH_ORDERS_START' });
        const orders = await getUserOrders();
        dispatch({ type: 'FETCH_ORDERS_SUCCESS', payload: orders.length });
      } catch (error) {
        console.error('Failed to load orders count', error);
        dispatch({ type: 'FETCH_ORDERS_SUCCESS', payload: 0 });
      }
    }

    fetchOrdersCount();
  }, [isAuthenticated, fetchOrders, dispatch]);

  useEffect(() => {
    async function fetchListingsCount() {
      if (!isAuthenticated || !fetchListings) return;
      try {
        dispatch({ type: 'FETCH_LISTINGS_START' });
        const listings = await getMyListings(1, 1);
        dispatch({ type: 'FETCH_LISTINGS_SUCCESS', payload: listings.total });
      } catch (error) {
        console.error('Failed to load listings count', error);
        dispatch({ type: 'FETCH_LISTINGS_SUCCESS', payload: 0 });
      }
    }

    fetchListingsCount();
  }, [isAuthenticated, fetchListings, dispatch]);

  useEffect(() => {
    async function fetchBalance() {
      if (!isAuthenticated || !fetchBalance) return;
      try {
        dispatch({ type: 'FETCH_BALANCE_START' });
        const data = await getWalletData();
        dispatch({ type: 'FETCH_BALANCE_SUCCESS', payload: data.balance });
      } catch (error) {
        console.error('Failed to load balance', error);
        dispatch({ type: 'FETCH_BALANCE_SUCCESS', payload: 0 });
      }
    }

    fetchBalance();
  }, [isAuthenticated, fetchBalance, dispatch]);

  return {
    ordersCount: stats.ordersCount,
    isLoadingOrders: stats.isLoadingOrders,
    listingsCount: stats.listingsCount,
    isLoadingListings: stats.isLoadingListings,
    balance: stats.balance,
    isLoadingBalance: stats.isLoadingBalance,
  };
}
