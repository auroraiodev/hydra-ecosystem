import React from 'react';
import { cn } from '@/lib/utils';
import { resolveLanguageName } from '@/lib/format';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { Button } from '@/components/ui/button';
import { Open24Regular } from '@fluentui/react-icons';
import { ItemStatusSelect } from './ItemStatusSelect';
import { DeleteItemButton } from './DeleteItemButton';
import type { Order } from '@/lib/types';

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

interface OrderItemsTableProps {
  order: Order;
  onRefresh: () => void;
  onRefreshWithBalance: () => void;
}

export function OrderItemsTable({ order, onRefresh, onRefreshWithBalance }: OrderItemsTableProps) {
  return (
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
              const pA = getStatusPriority(a.deliveryStatus || (a.isDelivered ? 'sold' : 'pending'));
              const pB = getStatusPriority(b.deliveryStatus || (b.isDelivered ? 'sold' : 'pending'));
              return pA - pB;
            })
            .map((item) => (
              <tr key={item.id} className="border-t border-border/40 transition-colors hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <ProductImageZoom
                      src={item.product?.image}
                      alt={item.product?.name || 'Unknown Product'}
                      className="h-16 w-12 sm:h-20 sm:w-14 shrink-0 rounded-lg shadow-sm"
                      fallbackIcon={
                        <span className="text-[10px] text-center text-muted-foreground">No Img</span>
                      }
                    />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="font-semibold text-sm tracking-tight truncate">
                        {item.product?.name || 'Unknown Product'}
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
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                              item.product.isLocalInventory
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-purple-50 text-purple-700 border-purple-100'
                            )}
                          >
                            {item.product.originLabel}
                          </span>
                        )}
                        {item.product?.language && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-blue-100 uppercase tracking-wider">
                            {resolveLanguageName(item.product.language)}
                          </span>
                        )}
                        {item.product?.isFoil && (
                          <span className="bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm uppercase tracking-wider">
                            FOIL
                          </span>
                        )}
                        {item.product?.condition && (
                          <span className="border border-border/60 bg-background px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider">
                            {item.product.condition}
                          </span>
                        )}
                      </div>
                      {item.product?.importationId && (
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 h-auto text-[10px] text-primary/70 hover:text-primary underline flex items-center gap-1 font-semibold w-fit"
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
                    currentStatus={item.deliveryStatus || (item.isDelivered ? 'sold' : 'pending')}
                    onRefresh={onRefresh}
                  />
                </td>
                <td className="p-4 text-right font-semibold text-sm tabular-nums text-muted-foreground/80">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="p-4 text-center font-black text-sm tabular-nums">{item.quantity}</td>
                <td className="p-4 text-right font-black text-sm tabular-nums text-primary/90">
                  ${item.totalPrice.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <DeleteItemButton
                    orderId={order.id}
                    itemId={item.id}
                    onItemDeleted={onRefreshWithBalance}
                  />
                </td>
              </tr>
            ))}
        </tbody>
        <tfoot className="bg-muted/30 font-semibold border-t border-border/50">
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
            <td colSpan={4} className="p-4 text-right text-sm font-black uppercase tracking-[0.15em]">
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
  );
}
