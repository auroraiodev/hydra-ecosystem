'use client';

import { useEffect, useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Search } from 'lucide-react';
import { getUserOrders, type OrderResponse } from '@/lib/api/orders';
import { OrderCard } from '@/features/orders/components';
import { FlowButton } from '@/features/shared/ui/flow-button';
import Link from 'next/link';
import {
  MobilePageContainer,
  DesktopPageContainer,
} from '@/features/shared/components/PageContainers';

interface OrdersState {
  data: OrderResponse[];
  isLoading: boolean;
}

type OrdersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: OrderResponse[] }
  | { type: 'FETCH_END' };

function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { ...state, data: action.payload };
    case 'FETCH_END':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export default function UserOrdersPage() {
  const { back } = useRouter();
  const [{ data: orders, isLoading }, dispatch] = useReducer(ordersReducer, {
    data: [],
    isLoading: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        dispatch({ type: 'FETCH_START' });
        const data = await getUserOrders();
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        dispatch({ type: 'FETCH_END' });
      }
    }

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile View */}
      <MobilePageContainer>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => back()} className="text-text-muted hover:text-primary">
              <ArrowLeft className="text-xl" />
            </button>
            <h1 className="text-xl font-semibold text-text-body">Mis Pedidos</h1>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-text-muted text-lg" />
            <input
              type="text"
              placeholder="Buscar por ID de orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-low border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex flex-col gap-y-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={`order-skeleton-mob-${num}`}
                  className="glass-panel ghost-border rounded-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-white/10 rounded-full animate-pulse" />
                        </div>
                        <div className="h-3 w-32 bg-white/5 rounded animate-pulse mt-1" />
                      </div>
                      <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((num) => (
                        <div
                          key={`order-skeleton-img-mob-${num}`}
                          className="w-12 h-16 bg-white/10 rounded-md animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] px-4 py-2 h-8 border-t border-white/5" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="flex flex-col gap-y-4 pb-20">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-16 bg-surface-low rounded-full flex items-center justify-center mb-4 border border-white/5">
                <ShoppingBag className="text-3xl text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-body mb-2">No tienes pedidos</h3>
              <p className="text-text-muted text-sm mb-6 max-w-[250px]">
                {searchTerm
                  ? 'No se encontraron pedidos con ese ID'
                  : 'Aún no has realizado ninguna compra en Hydra Collectables.'}
              </p>
              {!searchTerm && (
                <FlowButton asChild>
                  <Link href="/">Ir a comprar</Link>
                </FlowButton>
              )}
            </div>
          )}
        </div>
      </MobilePageContainer>

      {/* Desktop View */}
      <DesktopPageContainer>
        <div className="max-w-5xl mx-auto py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => back()}
                className="size-10 rounded-full bg-surface-low border border-white/10 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/50 transition-all shadow-sm"
              >
                <ArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-3xl font-semibold text-text-body">Mis Pedidos</h1>
                <p className="text-text-muted mt-1">Historial de todas tus compras</p>
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-text-muted text-lg" />
              <input
                type="text"
                placeholder="Buscar por ID de orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-low border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={`order-skeleton-desk-${num}`}
                  className="glass-panel ghost-border rounded-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-white/10 rounded-full animate-pulse" />
                        </div>
                        <div className="h-3 w-36 bg-white/5 rounded animate-pulse mt-1" />
                      </div>
                      <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((num) => (
                        <div
                          key={`order-skeleton-img-desk-${num}`}
                          className="w-12 h-16 bg-white/10 rounded-md animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] px-4 py-2 h-8 border-t border-white/5" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="glass-panel ghost-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <div className="size-16 bg-surface-low rounded-full flex items-center justify-center mb-4 border border-white/5">
                <ShoppingBag className="text-3xl text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-body mb-2">No tienes pedidos</h3>
              <p className="text-text-muted mb-6 max-w-sm">
                {searchTerm
                  ? 'No se encontraron pedidos con ese ID'
                  : 'Explora nuestra colección de cartas y empieza tu colección hoy mismo.'}
              </p>
              {!searchTerm && (
                <FlowButton asChild size="lg">
                  <Link href="/">Ir a comprar</Link>
                </FlowButton>
              )}
            </div>
          )}
        </div>
      </DesktopPageContainer>
    </>
  );
}
