'use client';

import { useEffect, useState, useCallback } from 'react';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  ArrowCounterclockwise24Regular,
  Alert24Regular,
} from '@fluentui/react-icons';
import { toast } from 'sonner';
import { ImportKpis } from './components/ImportKpis';
import { ImportTable } from './components/ImportTable';
import { type ImportItem, ITEM_STATUSES, STATUS_COLORS } from './types';

// ─── Normalization Utilities ──────────────────────────────────────────────────

const HARERUYA_LANG: Record<string, string> = {
  '1': 'JP', '2': 'EN', '3': 'FR', '4': 'CS', '5': 'FR', '6': 'DE',
  '7': 'IT', '8': 'KO', '9': 'PT', '10': 'RU', '11': 'ES', '12': 'EN',
};
const ENUM_LANG: Record<string, string> = {
  JAPANESE: 'JP', ENGLISH: 'EN', FRENCH: 'FR', CHINESE: 'CS', GERMAN: 'DE',
  ITALIAN: 'IT', KOREAN: 'KO', PORTUGUESE: 'PT', RUSSIAN: 'RU', SPANISH: 'ES',
};
const SPANISH_LANG: Record<string, string> = {
  Japonés: 'JP', Inglés: 'EN', Francés: 'FR', 'Chino Simplificado': 'CS',
  'Chino Tradicional': 'CT', Alemán: 'DE', Italiano: 'IT', Coreano: 'KO',
  Portugués: 'PT', Ruso: 'RU', Español: 'ES', Antiguo: 'AG',
};

function normalizeLanguage(raw: unknown): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (HARERUYA_LANG[s]) return HARERUYA_LANG[s];
  if (ENUM_LANG[s.toUpperCase()]) return ENUM_LANG[s.toUpperCase()];
  if (SPANISH_LANG[s]) return SPANISH_LANG[s];
  return s.length <= 3 ? s.toUpperCase() : s;
}

const CATEGORY_NAMES = new Set(['importacion', 'importacion express', 'importación', 'importación express']);
const CONDITION_MAP: Record<string, string> = {
  'near mint': 'NM', 'lightly played': 'LP', 'moderately played': 'MP',
  'heavily played': 'HP', damaged: 'DM',
};

function normalizeCondition(raw: unknown): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s || CATEGORY_NAMES.has(s.toLowerCase())) return '';
  return CONDITION_MAP[s.toLowerCase()] ?? s;
}

// ─── Raw API Types ────────────────────────────────────────────────────────────

interface RawOrder {
  id: string;
  users?: Record<string, unknown>;
  customer_name?: string;
  orderNumber?: string;
  order_number?: string;
  createdAt?: string;
  created_at?: string;
  importationItems?: RawItem[];
  importation_items?: RawItem[];
  items?: RawItem[];
}

interface RawItem {
  id: string;
  productData?: Record<string, unknown>;
  product_data?: Record<string, unknown>;
  unitPrice?: unknown;
  unit_price?: unknown;
  quantity?: unknown;
  deliveryStatus?: unknown;
  delivery_status?: unknown;
  importationId?: unknown;
  importation_id?: unknown;
  isFoil?: unknown;
}

// ─── Page Component ───────────────────────────────────────────────────────────

const str = (v: unknown, fb: string): string => (v as string) || fb;
const num = (v: unknown, fb: number): number => Number(v ?? fb) || fb;
const bool = (v: unknown, fb: boolean): boolean => (v !== undefined && v !== null) ? Boolean(v) : fb;

export default function ImportsPage() {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchImportItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statuses = ['PENDING', 'PAID', 'SHIPPED', 'PROCESSING'];
      const responses = await Promise.all(statuses.map(s => ordersAPI.list(1, 100, { status: s })));

      const extractOrders = (response: unknown): unknown[] => {
        if (Array.isArray(response)) return response;
        const r = response as Record<string, unknown> | null;
        if (r?.success && r?.data) {
          const d = r.data;
          return Array.isArray(d) ? d : (Array.isArray((d as Record<string, unknown>)?.data) ? (d as Record<string, unknown>).data as unknown[] : []);
        }
        return Array.isArray(r?.data) ? r.data as unknown[] : [];
      };

      const allOrders = responses.flatMap(extractOrders);
      const importItems: ImportItem[] = [];
      const IMPORT_CATEGORIES = ['importacion', 'importacion express'];

      (allOrders as RawOrder[]).forEach((order) => {
        const customerName = order.users
          ? `${str(order.users.first_name, '')} ${str(order.users.last_name, '')}`.trim() ||
            str(order.users.username, '') || str(order.users.email, '')
          : order.customer_name || 'Cliente';
        const orderNumber = str(order.orderNumber, '') || str(order.order_number, '') || order.id.slice(-6).toUpperCase();
        const orderDate = str(order.createdAt, '') || str(order.created_at, '');

        const importationItems = order.importationItems || order.importation_items || [];
        importationItems.forEach((item: RawItem) => {
          const product = (item.productData || item.product_data || {}) as Record<string, unknown>;
          importItems.push({
            id: item.id, orderId: order.id, orderNumber, orderDate, customerName,
            cardName: str(product.cardName, 'Carta desconocida'),
            expansion: str(product.expansion, ''),
            condition: normalizeCondition(str(product.condition, '')) || 'NM',
            language: normalizeLanguage(str(product.language, '')) || 'JP',
            isFoil: bool(product.foil, false) || bool(item.isFoil, false),
            isSurgeFoil: bool(product.surgeFoil, false) || bool(product.isSurgeFoil, false),
            deliveryStatus: str(item.deliveryStatus, '') || str(item.delivery_status, '') || 'pending',
            importationId: str(item.importationId, '') || str(item.importation_id, ''),
            image: str(product.imageUrl, '') || str(product.img, '') || str(product.image, ''),
            price: num(item.unitPrice, 0) || num(item.unit_price, 0),
            quantity: num(item.quantity, 1),
            itemType: 'importation',
          });
        });

        const regularItems = order.items || [];
        regularItems.forEach((item: RawItem) => {
          const product = (item.productData || item.product_data || {}) as Record<string, unknown>;
          const catObj = product.categories || product.category;
          const categoryName = str((catObj as Record<string, unknown> | undefined)?.name, '').toLowerCase();
          if (!IMPORT_CATEGORIES.includes(categoryName)) return;
          const langObj = product.languages as Record<string, unknown> | undefined;
          importItems.push({
            id: item.id, orderId: order.id, orderNumber, orderDate, customerName,
            cardName: str(product.cardName, 'Carta desconocida') || str(product.name, ''),
            expansion: str(product.expansion, ''),
            condition: normalizeCondition(str((product.conditions as Record<string, unknown> | undefined)?.name, '')) || str(product.condition, '') || 'NM',
            language: normalizeLanguage(str(langObj?.code, '') || str(langObj?.name, '')) || str(product.language, '') || '',
            isFoil: bool(product.foil, false) || bool(product.isFoil, false),
            isSurgeFoil: bool(product.surgeFoil, false) || bool(product.isSurgeFoil, false),
            deliveryStatus: str(item.deliveryStatus, '') || str(item.delivery_status, '') || 'pending',
            importationId: str(product.importationId, '') || str(product.importationProductId, ''),
            image: str(product.img, '') || str(product.imageUrl, '') || str(product.image, ''),
            price: num(item.unitPrice, 0) || num(item.unit_price, 0),
            quantity: num(item.quantity, 1),
            itemType: 'importacion',
          });
        });
      });

      const ORDER_MAP = { pending: 0, importing: 1, ready: 2, sold: 3 };
      importItems.sort((a, b) => {
        const oa = ORDER_MAP[a.deliveryStatus as keyof typeof ORDER_MAP] ?? 0;
        const ob = ORDER_MAP[b.deliveryStatus as keyof typeof ORDER_MAP] ?? 0;
        return oa !== ob ? oa - ob : new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      });

      setItems(importItems);
    } catch {
      setError('No se pudieron cargar los artículos a importar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImportItems();
  }, [fetchImportItems]);

  const handleStatusChange = async (itemId: string, orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateItemDeliveryStatus(orderId, itemId, { status: newStatus });
      const label = ITEM_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast.success(`Estado actualizado: ${label}`);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, deliveryStatus: newStatus } : i)));
    } catch {
      toast.error('Error al actualizar el estado');
      throw new Error('update failed');
    }
  };

  const getByStatus = (s: string) => items.filter((i) => i.deliveryStatus === s).length;
  const filteredItems = statusFilter === 'all' ? items : items.filter((i) => i.deliveryStatus === statusFilter);

  if (isLoading && items.length === 0) {
    return (
      <PageLayout>
        <PageHeader title="Importaciones" description="Gestiona el estado de cada carta importada por pedido." />
        <div className="space-y-6">
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 flex-1 rounded-xl bg-primary/[0.03] animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-4">
              <div className="h-5 w-32 bg-primary/[0.03] animate-pulse rounded" />
              <div className="h-4 w-64 bg-primary/[0.03] animate-pulse rounded mt-2" />
            </div>
            <div className="p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3 border-b last:border-b-0">
                  <div className="h-4 w-48 bg-primary/[0.03] animate-pulse rounded" />
                  <div className="h-4 w-24 bg-primary/[0.03] animate-pulse rounded" />
                  <div className="h-4 w-20 bg-primary/[0.03] animate-pulse rounded" />
                  <div className="h-6 w-24 bg-primary/[0.03] animate-pulse rounded-full" />
                  <div className="h-8 w-20 bg-primary/[0.03] animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Importaciones"
        description="Gestiona el estado de cada carta importada por pedido."
        action={
          <Button variant="outline" size="icon" onClick={fetchImportItems} disabled={isLoading}>
            <ArrowCounterclockwise24Regular className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <ImportKpis
        onFilterChange={setStatusFilter}
        currentFilter={statusFilter}
        getCountByStatus={getByStatus}
      />

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <Alert24Regular className="size-6 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchImportItems}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle>Lista de artículos</CardTitle>
              <CardDescription className="mt-1">
                Cambia el estado de cada carta individualmente. El cliente recibe una notificación automática.
              </CardDescription>
            </div>
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
                  {s.label} ({getByStatus(s.value)})
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ImportTable
            items={filteredItems}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
