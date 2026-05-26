'use client';

import { AlertTriangle, Package, ShieldCheck } from 'lucide-react';
import { OrderSummaryItemRow } from './OrderSummaryItemRow';
import type { OrderSummaryProps } from '../types';

const EMPTY_SELECTED_IDS: string[] = [];

export function OrderSummary({
  items,
  totalItems,
  totalPrice,
  shippingMethod,
  shippingCost,
  finalTotal,
  formatPrice,
  selectedItemIds = EMPTY_SELECTED_IDS,
  onToggleItem,
  onToggleAll,
}: OrderSummaryProps) {
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;
  const someSelected = selectedItemIds.length > 0 && selectedItemIds.length < items.length;
  const outOfStockSelected = items.filter(
    (item) => item.outOfStock && selectedItemIds.includes(item.id)
  );

  return (
    <div className="vault-glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-page-enter">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <Package className="size-4 text-teal" />
          <h3 className="text-sm font-semibold text-text-body uppercase tracking-tight">
            Resumen del Pedido
          </h3>
        </div>
        {onToggleAll && items.length > 1 && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="size-4 rounded border-white/20 text-teal focus:ring-teal/20 accent-teal"
            />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-teal transition-colors">
              Todos
            </span>
          </label>
        )}
      </div>

      {/* Items list */}
      <div className="p-4 gap-y-3 max-h-[320px] overflow-y-auto custom-scrollbar bg-black/20">
        {items.map((item) => (
          <OrderSummaryItemRow
            key={item.id}
            item={item}
            isSelected={selectedItemIds.includes(item.id)}
            onToggleItem={onToggleItem}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      {selectedItemIds.length < items.length && selectedItemIds.length >= 0 && onToggleItem && (
        <p className="text-[10px] font-bold text-teal/70 px-4 py-2 bg-teal/5 border-t border-teal/10 uppercase tracking-tight text-center">
          Los artículos no seleccionados quedarán en tu carrito.
        </p>
      )}

      {outOfStockSelected.length > 0 && (
        <div className="mx-4 my-3 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-black text-red-400 uppercase tracking-tight">
              {outOfStockSelected.length === 1
                ? '1 artículo sin stock'
                : `${outOfStockSelected.length} artículos sin stock`}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-red-400/80 leading-snug">
              Retira los artículos marcados en rojo para continuar.
            </p>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-5 border-t border-white/10 bg-white/5 gap-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span className="font-bold text-text-body tracking-tight tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Envío {shippingMethod === 'arrange' ? '(Por definir)' : '(Express)'}
          </span>
          <span className="font-bold text-text-body tracking-tight tabular-nums">
            {shippingMethod === 'arrange' ? (
              <span className="text-teal font-black">Por definir</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>
      </div>

      {/* Final total */}
      <div className="p-6 border-t border-white/10 bg-teal/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-40 bg-teal/20 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <span className="text-xs font-black text-text-body uppercase tracking-[0.2em] opacity-80">
              Total Final
            </span>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-teal tracking-tighter drop-shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.4)]">
              {formatPrice(finalTotal)}
            </span>
            <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mt-1">
              Moneda: MXN
            </p>
          </div>
        </div>
      </div>

      {/* Trust badge */}
      <div className="px-5 py-3 border-t border-white/5 bg-black/40">
        <div className="flex items-center justify-center gap-2.5 text-[10px] text-teal/80 font-black uppercase tracking-[0.05em]">
          <ShieldCheck className="size-4 text-teal animate-glow-pulse" />
          <span>Compra protegida y segura</span>
        </div>
      </div>
    </div>
  );
}
