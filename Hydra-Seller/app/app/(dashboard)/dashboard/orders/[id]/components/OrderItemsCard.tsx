import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Box24Regular,
  Add24Regular,
  Delete24Regular,
  Warning24Regular,
  Open24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';
import type { Order } from '@/lib/types';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';
import { useModal } from '@/components/providers/modal-context';

interface PaymentBalance {
  paidAmount: number;
  currentTotal: number;
  difference: number;
  paymentMethod: string;
  orderStatus: string;
  needsSupplementalPayment: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PaymentBalanceWarning({ balance, reopening, onReopen }: {
  balance: PaymentBalance; reopening: boolean; onReopen: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <Warning24Regular className="size-5 text-amber-600 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-amber-800">Saldo pendiente detectado</p>
        <p className="text-amber-700">
          El cliente pagó <strong>${balance.paidAmount.toFixed(2)} MXN</strong> pero el total
          actual es <strong>${balance.currentTotal.toFixed(2)} MXN</strong>. Diferencia:{' '}
          <strong>${balance.difference.toFixed(2)} MXN</strong>.
        </p>
      </div>
      <Button size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        onClick={onReopen} disabled={reopening}>
        {reopening ? <SpinnerIos20Regular className="size-4 animate-spin mr-2" /> : null}
        Reabrir y cobrar diferencia
      </Button>
    </div>
  );
}

function PaymentLinkBanner({ initPoint, onCopy }: { initPoint: string; onCopy: () => void }) {
  return (
    <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <Open24Regular className="size-5 text-blue-600 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-blue-800">Orden reabierta: comparte este enlace con el cliente</p>
        <a href={initPoint} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 underline break-all text-xs">{initPoint}</a>
      </div>
      <Button size="sm" variant="outline" onClick={onCopy}>Copiar</Button>
    </div>
  );
}

export function OrderItemsCard({
  order,
  onOpenAddItem,
  onRefresh,
}: {
  order: Order;
  onOpenAddItem: () => void;
  onRefresh: () => void;
}) {
  const [balance, setBalance] = React.useState<PaymentBalance | null>(null);
  const [reopening, setReopening] = React.useState(false);
  const [initPoint, setInitPoint] = React.useState<string | null>(null);

  const checkBalance = React.useCallback(async () => {
    // Only relevant for Mercado Pago orders that are already paid
    const isPaidStatus = ['paid', 'processing', 'shipped', 'completed'].includes(
      order.status.toLowerCase()
    );
    const isMercadoPago = order.paymentMethod?.toLowerCase() === 'mercadopago';
    if (!isPaidStatus || !isMercadoPago) return;

    try {
      const res = await ordersAPI.getPaymentBalance(order.id);
      const data =
        (res as { data?: PaymentBalance } & PaymentBalance).data ?? (res as PaymentBalance);
      setBalance(data);
    } catch {
      // silently ignore — balance check is non-critical
    }
  }, [order.id, order.status, order.paymentMethod]);

  // Check on mount and whenever the order prop refreshes
  React.useEffect(() => {
    void checkBalance();
  }, [checkBalance]);

  const handleRefreshWithBalance = React.useCallback(async () => {
    onRefresh();
    await checkBalance();
  }, [onRefresh, checkBalance]);

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await ordersAPI.reopenForPayment(order.id);
      const data =
        (
          res as { data?: { initPoint: string; difference: number } } & {
            initPoint: string;
            difference: number;
          }
        ).data ?? (res as { initPoint: string; difference: number });
      setInitPoint(data.initPoint);
      setBalance(null);
      toast.success(`Orden reabierta. Saldo pendiente: $${data.difference.toFixed(2)} MXN`);
      onRefresh();
    } catch {
      toast.error('Error al reabrir la orden');
    } finally {
      setReopening(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-6 border-b border-primary/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Box24Regular className="size-5 text-primary" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Artículos del Pedido
          </h2>
        </div>
        <Button
          onClick={onOpenAddItem}
          size="sm"
          className="h-10 px-6 rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-playful hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Add24Regular className="mr-2 size-4" />
          Agregar Artículo
        </Button>
      </div>
      <CardContent className="p-0">
        {balance?.needsSupplementalPayment && !initPoint && (
          <PaymentBalanceWarning balance={balance} reopening={reopening} onReopen={handleReopen} />
        )}
        {initPoint && (
          <PaymentLinkBanner
            initPoint={initPoint}
            onCopy={() => { navigator.clipboard.writeText(initPoint); toast.success('Enlace copiado'); }}
          />
        )}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary/[0.01] border-b border-primary/5">
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Producto
                </th>
                <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 w-32">
                  Estado
                </th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Precio
                </th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Cant
                </th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {order.items
                .toSorted((a, b) => {
                  const pA = getStatusPriority(
                    a.deliveryStatus || (a.isDelivered ? 'sold' : 'pending')
                  );
                  const pB = getStatusPriority(
                    b.deliveryStatus || (b.isDelivered ? 'sold' : 'pending')
                  );
                  return pA - pB;
                })
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <ProductImageZoom
                          src={item.product?.image}
                          alt={item.productName}
                          className="h-16 w-12 sm:h-20 sm:w-14 shrink-0 rounded-lg shadow-sm"
                          fallbackIcon={
                            <span className="text-[10px] text-center text-muted-foreground">
                              No Img
                            </span>
                          }
                        />
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span className="font-bold text-sm tracking-tight truncate">
                            {item.productName}
                          </span>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {item.product?.cardNumber && (
                              <span className="text-[10px] text-muted-foreground/60 font-black tabular-nums">
                                #{item.product.cardNumber}
                              </span>
                            )}
                            {item.product?.cardSet && (
                              <span className="bg-secondary/50 px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground font-black uppercase tracking-wider">
                                {item.product.cardSet}
                              </span>
                            )}
                            {item.product?.originLabel && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                {item.product.originLabel}
                              </span>
                            )}
                            {item.product?.language && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-blue-100 uppercase tracking-wider">
                                {item.product.language}
                              </span>
                            )}
                            {item.product?.isFoil && (
                              <span className="bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm uppercase tracking-wider">
                                FOIL
                              </span>
                            )}
                            {item.product?.condition && (
                              <span className="border border-border/60 bg-background px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">
                                {item.product.condition}
                              </span>
                            )}
                          </div>
                          {item.product?.importationId && (
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 h-auto text-[10px] text-primary/70 hover:text-primary underline flex items-center gap-1 font-bold w-fit"
                              onClick={() =>
                                window.open(
                                  `https://www.importationmtg.com/en/products/detail/${item.product?.importationId}`,
                                  '_blank'
                                )
                              }
                            >
                              Ver en Importation
                              <Open24Regular className="size-2.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <ItemStatusSelect
                        orderId={order.id}
                        itemId={item.id}
                        currentStatus={
                          item.deliveryStatus || (item.isDelivered ? 'sold' : 'pending')
                        }
                        onRefresh={onRefresh}
                      />
                    </td>
                    <td className="p-4 text-right font-bold text-sm tabular-nums text-muted-foreground/80">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-black text-sm tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="p-4 text-right font-black text-sm tabular-nums text-primary/90">
                      ${item.totalPrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <DeleteItemButton
                        orderId={order.id}
                        itemId={item.id}
                        onItemDeleted={handleRefreshWithBalance}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="bg-muted/30 font-bold border-t border-border/50">
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-right text-muted-foreground/60 text-xs font-black uppercase tracking-wider"
                >
                  Subtotal
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm">
                  ${order.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
              {(order.importFee || 0) > 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-muted-foreground/60 text-xs font-black uppercase tracking-wider"
                  >
                    Import Fee
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-blue-600">
                    ${(order.importFee || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
              {(order.paymentServiceFee || 0) > 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-muted-foreground/60 text-xs font-black uppercase tracking-wider"
                  >
                    Service Fee
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-muted-foreground/80">
                    ${(order.paymentServiceFee || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
              <tr className="bg-muted/50">
                <td
                  colSpan={4}
                  className="p-4 text-right text-sm font-black uppercase tracking-[0.15em]"
                >
                  Total
                </td>
                <td className="p-4 text-right font-black text-lg tabular-nums text-primary leading-none">
                  ${order.total.toFixed(2)}
                </td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

const ITEM_STATUSES: { value: string; label: string; color: string; bg: string }[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    value: 'ready',
    label: 'Listo para entrega',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  {
    value: 'importing',
    label: 'Importando',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    value: 'sold',
    label: 'Entregado',
    color: 'text-zinc-600',
    bg: 'bg-zinc-50 border-zinc-200',
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
  },
];

const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  ready: 1,
  importing: 2,
  sold: 3,
  cancelled: 4,
};

function getStatusPriority(status?: string | null): number {
  if (!status) return 0;
  return STATUS_PRIORITY[status.toLowerCase()] ?? 99;
}

function ItemStatusSelect({
  orderId,
  itemId,
  currentStatus,
  onRefresh,
}: {
  orderId: string;
  itemId: string;
  currentStatus: string;
  onRefresh: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const optimisticRef = React.useRef<string | null>(null);
  const localStatus = optimisticRef.current ?? currentStatus;

  const handleChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;
    optimisticRef.current = newStatus;
    setIsUpdating(true);
    try {
      await ordersAPI.updateItemDeliveryStatus(orderId, itemId, { status: newStatus });
      const label = ITEM_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast.success(`Item marcado como ${label}`);
      onRefresh();
    } catch {
      optimisticRef.current = null;
      toast.error('Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={localStatus} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger
        className={`h-8 text-[10px] w-full max-w-[160px] mx-auto font-black uppercase tracking-wider shadow-sm transition-all ${
          ITEM_STATUSES.find((s) => s.value === localStatus)?.bg || ''
        } ${ITEM_STATUSES.find((s) => s.value === localStatus)?.color || ''}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ITEM_STATUSES.map((s) => (
          <SelectItem
            key={s.value}
            value={s.value}
            className={`text-[10px] font-black uppercase tracking-wider ${s.color}`}
          >
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DeleteItemButton({
  orderId,
  itemId,
  onItemDeleted,
}: {
  orderId: string;
  itemId: string;
  onItemDeleted: () => void;
}) {
  const { showLoading, hideModal } = useModal();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    showLoading('Removing item...');
    try {
      await ordersAPI.removeItems(orderId, [itemId]);
      toast.success('Item removed');
      onItemDeleted();
    } catch {
      toast.error('Failed to remove item');
    } finally {
      hideModal();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
      onClick={handleDelete}
    >
      <Delete24Regular className="size-4" />
    </Button>
  );
}
