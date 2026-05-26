'use client';

import { useEffect, useMemo, useCallback, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { singlesAPI, usersAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Clipboard24Regular, Box24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';

import { UserSelector } from './components/UserSelector';
import { CountingCard } from './components/CountingCard';
import { InventoryReport } from './components/InventoryReport';
import {
  type User,
  type ApiProduct,
  type CountEntry,
  type Mode,
  userName,
} from './types';

// ─── Reducer ─────────────────────────────────────────────────────────────────

interface InventoryState {
  users: User[];
  usersLoading: boolean;
  selectedUserId: string;
  usersOpen: boolean;
  allProducts: ApiProduct[];
  productsLoading: boolean;
  mode: Mode;
  countIndex: number;
  counts: CountEntry[];
  applying: boolean;
}

type InventoryAction =
  | { type: 'SET_USERS'; users: User[] }
  | { type: 'SET_USERS_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_USER'; id: string }
  | { type: 'SET_USERS_OPEN'; open: boolean }
  | { type: 'SET_PRODUCTS'; products: ApiProduct[] }
  | { type: 'SET_PRODUCTS_LOADING'; loading: boolean }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_COUNT_INDEX'; index: number | ((prev: number) => number) }
  | { type: 'SET_COUNTS'; counts: CountEntry[] | ((prev: CountEntry[]) => CountEntry[]) }
  | { type: 'SET_APPLYING'; applying: boolean }
  | { type: 'RESET_COUNTING' }
  | { type: 'UPDATE_PRODUCT_STOCK'; id: string; stock: number };

function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_USERS_LOADING': return { ...state, usersLoading: action.loading };
    case 'SET_SELECTED_USER': return { ...state, selectedUserId: action.id };
    case 'SET_USERS_OPEN': return { ...state, usersOpen: action.open };
    case 'SET_PRODUCTS': return { ...state, allProducts: action.products };
    case 'SET_PRODUCTS_LOADING': return { ...state, productsLoading: action.loading };
    case 'SET_MODE': return { ...state, mode: action.mode };
    case 'SET_COUNT_INDEX':
      return { ...state, countIndex: typeof action.index === 'function' ? action.index(state.countIndex) : action.index };
    case 'SET_COUNTS':
      return { ...state, counts: typeof action.counts === 'function' ? action.counts(state.counts) : action.counts };
    case 'SET_APPLYING': return { ...state, applying: action.applying };
    case 'RESET_COUNTING': return { ...state, counts: [], countIndex: 0, mode: 'idle' };
    case 'UPDATE_PRODUCT_STOCK':
      return { ...state, allProducts: state.allProducts.map((p) => (p.id === action.id ? { ...p, stock: action.stock } : p)) };
    default: return state;
  }
}

const initialInventoryState: InventoryState = {
  users: [], usersLoading: true, selectedUserId: '', usersOpen: false,
  allProducts: [], productsLoading: false, mode: 'idle', countIndex: 0,
  counts: [], applying: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventarioContent() {
  const [state, dispatch] = useReducer(inventoryReducer, initialInventoryState);
  const {
    users, usersLoading, selectedUserId, usersOpen, allProducts,
    productsLoading, mode, countIndex, counts, applying,
  } = state;

  useEffect(() => {
    usersAPI.list(undefined, true)
      .then((res: unknown) => {
        const resData = res as Record<string, unknown>;
        const raw = (resData?.data as Record<string, unknown> | undefined)?.data || resData?.data || res || [];
        dispatch({ type: 'SET_USERS', users: Array.isArray(raw) ? (raw as typeof state.users) : [] });
      })
      .catch(() => toast.error('Error al cargar colaboradores'))
      .finally(() => dispatch({ type: 'SET_USERS_LOADING', loading: false }));
  }, [state]);

  useEffect(() => {
    if (!selectedUserId) {
      dispatch({ type: 'SET_PRODUCTS', products: [] });
      return;
    }
    dispatch({ type: 'SET_PRODUCTS_LOADING', loading: true });
    dispatch({ type: 'RESET_COUNTING' });

    singlesAPI.getByOwner(selectedUserId, 1, 500)
      .then((res: unknown) => {
        const resData = res as Record<string, unknown>;
        const raw = (resData?.data as Record<string, unknown> | undefined)?.data || resData?.data || res || [];
        dispatch({ type: 'SET_PRODUCTS', products: Array.isArray(raw) ? (raw as never[]) : [] });
      })
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => dispatch({ type: 'SET_PRODUCTS_LOADING', loading: false }));
  }, [selectedUserId]);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId), [users, selectedUserId]);

  const handleConfirm = useCallback((physicalStock: number) => {
    const product = allProducts[countIndex];
    dispatch({
      type: 'SET_COUNTS',
      counts: (prev) => [...prev, { productId: product.id, systemStock: product.stock, physicalStock, skipped: false }],
    });
    if (countIndex + 1 >= allProducts.length) dispatch({ type: 'SET_MODE', mode: 'review' });
    else dispatch({ type: 'SET_COUNT_INDEX', index: (i) => i + 1 });
  }, [allProducts, countIndex]);

  const handleSkip = useCallback(() => {
    const product = allProducts[countIndex];
    dispatch({
      type: 'SET_COUNTS',
      counts: (prev) => [...prev, { productId: product.id, systemStock: product.stock, physicalStock: product.stock, skipped: true }],
    });
    if (countIndex + 1 >= allProducts.length) dispatch({ type: 'SET_MODE', mode: 'review' });
    else dispatch({ type: 'SET_COUNT_INDEX', index: (i) => i + 1 });
  }, [allProducts, countIndex]);

  const handleApplyFixes = useCallback(async (fixes: { id: string; stock: number }[]) => {
    dispatch({ type: 'SET_APPLYING', applying: true });
    let saved = 0, failed = 0;
    await Promise.allSettled(fixes.map(async ({ id, stock }) => {
      try {
        await singlesAPI.update(id, { stock });
        dispatch({ type: 'UPDATE_PRODUCT_STOCK', id, stock });
        saved++;
      } catch { failed++; }
    }));
    dispatch({ type: 'SET_APPLYING', applying: false });
    if (failed === 0) toast.success(`${saved} correcciones aplicadas`);
    else toast.warning(`${saved} aplicadas, ${failed} fallaron`);
  }, []);

  return (
    <PageLayout>
      <PageHeader title="Inventario" description="Conteo físico y verificación de existencias" />

      <UserSelector
        users={users}
        isLoading={usersLoading}
        selectedUserId={selectedUserId}
        isOpen={usersOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_USERS_OPEN', open })}
        onSelect={(id) => dispatch({ type: 'SET_SELECTED_USER', id })}
        disabled={mode === 'counting'}
      />

      {mode === 'idle' && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            {productsLoading ? (
              <>
                <SpinnerIos20Regular className="size-12 mb-4 text-primary animate-spin" />
                <p className="text-muted-foreground">Sincronizando productos del colaborador…</p>
              </>
            ) : selectedUserId ? (
              <>
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clipboard24Regular className="size-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Listo para el conteo</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Se encontraron <strong>{allProducts.length}</strong> productos para{' '}
                  {userName(selectedUser!)}.
                </p>
                <Button size="lg" onClick={() => dispatch({ type: 'SET_MODE', mode: 'counting' })} disabled={allProducts.length === 0}>
                  Comenzar auditoría
                </Button>
              </>
            ) : (
              <>
                <Box24Regular className="size-12 mb-4 text-muted-foreground/20" />
                <p className="text-muted-foreground">Selecciona un colaborador para auditar su inventario.</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {mode === 'counting' && allProducts[countIndex] && (
        <CountingCard
          product={allProducts[countIndex]}
          index={countIndex}
          total={allProducts.length}
          onConfirm={handleConfirm}
          onSkip={handleSkip}
        />
      )}

      {mode === 'review' && (
        <InventoryReport
          products={allProducts}
          counts={counts}
          ownerName={userName(selectedUser!)}
          onApplyFixes={handleApplyFixes}
          onReset={() => dispatch({ type: 'RESET_COUNTING' })}
          applying={applying}
        />
      )}
    </PageLayout>
  );
}
