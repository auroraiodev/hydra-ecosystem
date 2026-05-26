'use client';

import { useEffect, useReducer } from 'react';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowSync24Regular,
  ArrowTrending24Regular,
  Money24Regular,
  Box24Regular,
} from '@fluentui/react-icons';
import { toast } from 'sonner';
import Image from 'next/image';
import { ClientDate } from '@/components/ClientDate';

type Sale = {
  id: string;
  amount: number;
  createdAt: string | Date;
  description?: string;
  orderNumber?: string;
  product?: {
    name: string;
    image?: string;
    expansion?: string;
    condition?: string;
  };
  seller?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

type SalesState = {
  sales: Sale[];
  loading: boolean;
  stats: { totalSales: number; totalAmount: number; commission: number };
};

export default function SalesHistoryPage() {
  const [state, dispatch] = useReducer(
    (s: SalesState, a: Partial<SalesState>): SalesState => ({ ...s, ...a }),
    { sales: [], loading: true, stats: { totalSales: 0, totalAmount: 0, commission: 0 } }
  );

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await ordersAPI.getSales(1, 100);
        const salesData = response.data || [];

        const total = salesData.reduce((sum: number, sale: Sale) => sum + sale.amount, 0);
        dispatch({
          sales: salesData,
          stats: {
            totalSales: salesData.length,
            totalAmount: total,
            commission: total * 0.1, // 10% commission assumed
          },
        });
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar el historial de ventas');
      } finally {
        dispatch({ loading: false });
      }
    }
    loadSales();
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <ArrowSync24Regular className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground text-sm">
          Historial completo de artículos marcados como vendidos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white shadow-lg border-none overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">
              Ventas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{state.stats.totalSales}</div>
            <ArrowTrending24Regular className="absolute right-4 bottom-4 size-12 opacity-10" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-600 text-white shadow-lg border-none overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">
              Monto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${state.stats.totalAmount.toFixed(2)}</div>
            <Money24Regular className="absolute right-4 bottom-4 size-12 opacity-10" />
          </CardContent>
        </Card>

        <Card className="bg-purple-600 text-white shadow-lg border-none overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">
              Comisión (10%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${state.stats.commission.toFixed(2)}</div>
            <Box24Regular className="absolute right-4 bottom-4 size-12 opacity-10" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Artículo</th>
                  <th className="p-3 text-left">Vendedor</th>
                  <th className="p-3 text-right">Monto Neto</th>
                  <th className="p-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {state.sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                      No hay ventas registradas aún.
                    </td>
                  </tr>
                ) : (
                  state.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {sale.product?.image ? (
                            <div className="h-12 w-9 relative rounded overflow-hidden shadow-sm flex-shrink-0 border bg-zinc-100">
                              <Image
                                src={sale.product.image}
                                alt={sale.product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-9 bg-muted rounded flex items-center justify-center flex-shrink-0 border">
                              <Box24Regular className="size-4 text-muted-foreground opacity-50" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold line-clamp-1">
                              {sale.product?.name || sale.description}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                              <span className="bg-muted px-1 rounded uppercase">
                                {sale.orderNumber}
                              </span>
                              {sale.product?.expansion && <span>• {sale.product.expansion}</span>}
                              {sale.product?.condition && <span>• {sale.product.condition}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-zinc-100 flex items-center justify-center border text-[10px] font-bold text-zinc-600 uppercase">
                            {sale.seller?.first_name?.[0] || sale.seller?.email?.[0] || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs">
                              {sale.seller?.first_name
                                ? `${sale.seller.first_name} ${sale.seller.last_name || ''}`.trim()
                                : 'Vendedor'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {sale.seller?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        +${sale.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        <div className="flex flex-col items-end">
<span className="text-xs">
                             <ClientDate date={sale.createdAt} />
                           </span>
                          <span className="text-[10px] opacity-70">
                            <ClientDate
                              date={sale.createdAt}
                              formatter={(d) =>
                                d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
