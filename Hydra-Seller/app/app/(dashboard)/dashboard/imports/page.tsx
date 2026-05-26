'use client';

import { useEffect, useState, useRef } from 'react';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SpinnerIos20Regular,
  VehicleTruck24Regular,
  ArrowCounterclockwise24Regular,
  ErrorCircle24Regular,
  Box24Regular,
  CheckmarkCircle24Regular,
  History24Regular,
  Airplane24Regular,
} from '@fluentui/react-icons';
import { toast } from 'sonner';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { ClientDate } from '@/components/ClientDate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  cardName: string;
  expansion: string;
  condition: string;
  language: string;
  isFoil: boolean;
  isSurgeFoil: boolean;
  deliveryStatus: string;
  importationId: string;
  image?: string;
  price: number;
  quantity: number;
  itemType: 'importation' | 'importacion';
}

const ITEM_STATUSES = [
  { value: 'pending', label: 'Pendiente', icon: History24Regular },
  { value: 'importing', label: 'Importando', icon: Airplane24Regular },
  { value: 'ready', label: 'Listo para entrega', icon: Box24Regular },
  { value: 'sold', label: 'Entregado', icon: CheckmarkCircle24Regular },
];

const STATUS_COLORS: Record<string, string> = {
  pending:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  importing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  ready: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  sold: 'bg-muted text-muted-foreground border-border',
};

// ─── Status select with optimistic update ─────────────────────────────────────

function ItemStatusSelect({
  item,
  onStatusChange,
}: {
  item: ImportItem;
  onStatusChange: (itemId: string, orderId: string, newStatus: string) => Promise<void>;
}) {
  const [localStatus, setLocalStatus] = useState(item.deliveryStatus || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const optimisticRef = useRef<string | null>(null);

  useEffect(() => {
    if (optimisticRef.current === null) {
      setLocalStatus(item.deliveryStatus || 'pending');
    } else if (item.deliveryStatus === optimisticRef.current) {
      optimisticRef.current = null;
    }
  }, [item.deliveryStatus]);

  const handleChange = async (newStatus: string) => {
    if (newStatus === localStatus || isUpdating) return;
    const previous = localStatus;
    optimisticRef.current = newStatus;
    setLocalStatus(newStatus);
    setIsUpdating(true);
    try {
      await onStatusChange(item.id, item.orderId, newStatus);
    } catch {
      optimisticRef.current = null;
      setLocalStatus(previous);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={localStatus} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger className={`h-8 text-xs w-44 border ${STATUS_COLORS[localStatus] ?? ''}`}>
        {isUpdating ? <SpinnerIos20Regular className="size-3 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {ITEM_STATUSES.map((s) => {
          const Icon = s.icon;
          return (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              <span className="flex items-center gap-1.5">
                <Icon className="size-3" />
                {s.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ImportsPage() {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchImportItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pendingOrders, paidOrders, shippedOrders, processingOrders] = await Promise.all([
        ordersAPI.list(1, 100, { status: 'PENDING' }),
        ordersAPI.list(1, 100, { status: 'PAID' }),
        ordersAPI.list(1, 100, { status: 'SHIPPED' }),
        ordersAPI.list(1, 100, { status: 'PROCESSING' }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extractOrders = (response: any): any[] => {
        if (Array.isArray(response)) return response;
        if (response?.success && response?.data) {
          const d = response.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.data)) return d.data;
        }
        if (Array.isArray(response?.data)) return response.data;
        return [];
      };

      const allOrders = [
        ...extractOrders(pendingOrders),
        ...extractOrders(paidOrders),
        ...extractOrders(shippedOrders),
        ...extractOrders(processingOrders),
      ];

      const importItems: ImportItem[] = [];
      const IMPORT_CATEGORIES = ['importacion', 'importacion express'];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allOrders.forEach((order: any) => {
        const customerName = order.users
          ? `${order.users.first_name || ''} ${order.users.last_name || ''}`.trim() ||
            order.users.username ||
            order.users.email
          : order.customer_name || 'Cliente';
        const orderNumber =
          order.orderNumber || order.order_number || order.id.slice(-6).toUpperCase();
        const orderDate = order.createdAt || order.created_at || '';

        // Importation items
        const importationItems = order.importationItems || order.importation_items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        importationItems.forEach((item: any) => {
          const product = item.productData || item.product_data || {};
          importItems.push({
            id: item.id,
            orderId: order.id,
            orderNumber,
            orderDate,
            customerName,
            cardName: product.cardName || product.name || 'Carta desconocida',
            expansion: product.expansion || '',
            condition: product.condition || 'NM',
            language: product.language || 'JP',
            isFoil: product.foil || item.isFoil || false,
            isSurgeFoil: product.surgeFoil || product.isSurgeFoil || false,
            deliveryStatus: item.deliveryStatus || item.delivery_status || 'pending',
            importationId: item.importationId || item.importation_id || '',
            image: product.imageUrl || product.img || product.image,
            price: Number(item.unitPrice ?? item.unit_price) || 0,
            quantity: item.quantity || 1,
            itemType: 'importation',
          });
        });

        // Local items with importacion category
        const regularItems = order.items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        regularItems.forEach((item: any) => {
          const product = item.productData || item.product_data || {};
          const categoryName = (
            product.categories?.name ||
            product.category?.name ||
            ''
          ).toLowerCase();
          if (!IMPORT_CATEGORIES.includes(categoryName)) return;
          importItems.push({
            id: item.id,
            orderId: order.id,
            orderNumber,
            orderDate,
            customerName,
            cardName: product.cardName || product.name || 'Carta desconocida',
            expansion: product.expansion || '',
            condition: product.conditions?.name || product.condition || 'NM',
            language: product.languages?.name || product.language || '',
            isFoil: product.foil || product.isFoil || false,
            isSurgeFoil: product.surgeFoil || product.isSurgeFoil || false,
            deliveryStatus: item.deliveryStatus || item.delivery_status || 'pending',
            importationId: product.importationId || product.importationProductId || '',
            image: product.img || product.imageUrl || product.image,
            price: Number(item.unitPrice ?? item.unit_price) || 0,
            quantity: item.quantity || 1,
            itemType: 'importacion',
          });
        });
      });

      // Sort: pending → importing → ready → sold, then by date ascending
      const ORDER = { pending: 0, importing: 1, ready: 2, sold: 3 };
      importItems.sort((a, b) => {
        const oa = ORDER[a.deliveryStatus as keyof typeof ORDER] ?? 0;
        const ob = ORDER[b.deliveryStatus as keyof typeof ORDER] ?? 0;
        if (oa !== ob) return oa - ob;
        return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      });

      setItems(importItems);
    } catch {
      setError('No se pudieron cargar los artículos a importar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImportItems();
  }, []);

  const handleStatusChange = async (itemId: string, orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateItemDeliveryStatus(orderId, itemId, { status: newStatus });
      const label = ITEM_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast.success(`Estado actualizado: ${label}`);
      // Update local state without full refetch
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, deliveryStatus: newStatus } : i))
      );
    } catch {
      toast.error('Error al actualizar el estado');
      throw new Error('update failed');
    }
  };

  // ── KPIs + filter ─────────────────────────────────────────────────────────
  const byStatus = (s: string) => items.filter((i) => i.deliveryStatus === s).length;
  const filteredItems =
    statusFilter === 'all' ? items : items.filter((i) => i.deliveryStatus === statusFilter);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerIos20Regular className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <VehicleTruck24Regular className="size-8 text-primary" />
            Importaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el estado de cada carta importada por pedido.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchImportItems} disabled={isLoading}>
          <ArrowCounterclockwise24Regular className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* KPIs — click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ITEM_STATUSES.map((s) => {
          const Icon = s.icon;
          const active = statusFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(active ? 'all' : s.value)}
              className={`text-left rounded-xl border transition-all ${STATUS_COLORS[s.value]} ${active ? 'ring-2 ring-offset-2 ring-current shadow-md scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:shadow-sm'}`}
            >
              <div className="pb-2 pt-4 px-4">
                <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {s.label}
                </p>
              </div>
              <div className="px-4 pb-4">
                <p className="text-2xl font-bold">{byStatus(s.value)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6 flex items-center gap-3">
            <ErrorCircle24Regular className="size-5 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle>Lista de artículos</CardTitle>
              <CardDescription className="mt-1">
                Cambia el estado de cada carta individualmente. El cliente recibe una notificación
                automática al pasar a &ldquo;Importando&rdquo;, &ldquo;Listo para entrega&rdquo; o
                &ldquo;Entregado&rdquo;.
              </CardDescription>
            </div>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
              >
                Todos ({items.length})
              </button>
              {ITEM_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter === s.value ? `${STATUS_COLORS[s.value]} ring-1 ring-current` : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
                >
                  {s.label} ({byStatus(s.value)})
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium">Carta</th>
                  <th className="p-3 text-left font-medium">Pedido</th>
                  <th className="p-3 text-left font-medium">Detalles</th>
                  <th className="p-3 text-center font-medium w-16">Cant.</th>
                  <th className="p-3 text-right font-medium">Precio</th>
                  <th className="p-3 text-center font-medium w-52">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      {statusFilter === 'all'
                        ? 'No hay artículos de importación en pedidos activos.'
                        : `No hay artículos con estado "${ITEM_STATUSES.find((s) => s.value === statusFilter)?.label}".`}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${item.deliveryStatus === 'sold' ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/30'}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <ProductImageZoom
                            src={item.image}
                            alt={item.cardName}
                            className="h-20 w-14 shrink-0"
                          />
                          <div>
                            <p className="font-semibold leading-tight">{item.cardName}</p>
                            {item.importationId && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                ID: {item.importationId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit font-mono text-xs">
                            #{item.orderNumber}
                          </Badge>
                          <span className="text-xs truncate max-w-[140px]">
                            {item.customerName}
                          </span>
                          {item.orderDate && (
<span
                               className="text-[10px] text-muted-foreground"
                             >
                               <ClientDate
                                 date={item.orderDate}
                                 format={{ day: '2-digit', month: 'short', year: 'numeric' }}
                               />
                             </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.expansion && (
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {item.expansion}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {item.condition}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase text-blue-600 border-blue-200"
                          >
                            {item.language}
                          </Badge>
                          {item.isSurgeFoil ? (
                            <Badge className="text-[10px] bg-purple-500 text-white hover:bg-purple-500">
                              SURGE FOIL
                            </Badge>
                          ) : item.isFoil ? (
                            <Badge className="text-[10px] bg-yellow-400 text-yellow-950 hover:bg-yellow-400">
                              FOIL
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">${item.price.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <ItemStatusSelect item={item} onStatusChange={handleStatusChange} />
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
