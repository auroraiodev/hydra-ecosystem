'use client';

import { useReducer, useCallback, useEffect, useState } from 'react';
import { transactionsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterState {
  search: string;
  typeFilter: string;
  page: number;
}

type FilterAction =
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_TYPE_FILTER'; typeFilter: string }
  | { type: 'SET_PAGE'; page: number };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH': return { ...state, search: action.search };
    case 'SET_TYPE_FILTER': return { ...state, typeFilter: action.typeFilter, page: 1 };
    case 'SET_PAGE': return { ...state, page: action.page };
    default: return state;
  }
}

export function useHistorialManager() {
  const [filter, dispatchFilter] = useReducer(filterReducer, {
    search: '',
    typeFilter: 'all',
    page: 1,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await transactionsAPI.list(filter.page, pagination.limit, {
        type: filter.typeFilter !== 'all' ? filter.typeFilter : undefined,
      });

      if (response.success && response.data) {
        setTransactions(response.data.data);
        setPagination({
          page: response.data.meta.page,
          limit: response.data.meta.limit,
          total: response.data.meta.total,
          totalPages: response.data.meta.totalPages,
        });
      }
    } catch (err) {
      toast.error('Error al cargar transacciones');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filter.page, filter.typeFilter, pagination.limit]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter((t) => {
    if (!filter.search) return true;
    const s = filter.search.toLowerCase();
    return (
      t.description?.toLowerCase().includes(s) ||
      t.users.email.toLowerCase().includes(s) ||
      t.users.first_name.toLowerCase().includes(s) ||
      t.users.last_name.toLowerCase().includes(s)
    );
  });

  const totals = {
    credits: filtered.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0),
    debits: Math.abs(filtered.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)),
  };

  return {
    filtered,
    pagination,
    isLoading,
    filter,
    dispatchFilter,
    totals,
  };
}
