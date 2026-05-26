'use client';

import Image from 'next/image';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import type { OrderSummaryItemRowProps } from '../types';

export function OrderSummaryItemRow({
  item,
  isSelected,
  onToggleItem,
  formatPrice,
}: OrderSummaryItemRowProps) {
  const isOutOfStock = item.outOfStock === true;

  return (
    <div
      className={`flex gap-4 items-center rounded-xl transition-all p-3 ${
        isOutOfStock
          ? 'border border-red-500/30 bg-red-500/10'
          : isSelected
            ? 'bg-white/5 border border-white/5 shadow-lg'
            : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
      }`}
    >
      {onToggleItem && (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleItem(item.id)}
            className="size-4 rounded border-white/20 text-teal focus:ring-teal/20 accent-teal cursor-pointer"
          />
        </div>
      )}
      <div className="relative w-14 h-18 bg-black/40 rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-inner">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" />
        )}
        {item.foil && <ShaderAnimation />}
        <span className="absolute top-0 right-0 m-0.5 min-size-[18px] px-1 bg-teal text-black text-[10px] font-black flex items-center justify-center rounded-full z-10 shadow-lg">
          {item.quantity}
        </span>
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 backdrop-blur-[2px]">
            <span className="text-[8px] font-black uppercase tracking-tighter text-white px-1 text-center leading-tight">
              {item.price === 0 ? 'Precio no disponible' : 'Agotado'}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-black text-[13px] leading-tight mb-1 tracking-tight ${isOutOfStock ? 'text-red-400' : 'text-text-body'}`}
        >
          {item.cardName || item.title}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-wider">
            {item.condition || 'Near Mint'}
          </span>
          {isOutOfStock ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Sin stock
            </span>
          ) : (
            (() => {
              const isPersonal = Array.isArray(item.metadata)
                ? item.metadata.some((m) => m.toLowerCase() === 'personal')
                : typeof item.metadata === 'string' &&
                  item.metadata.toLowerCase().includes('personal');
              const isInDb = !!(item.immediateDelivery || item.isLocalInventory);

              if (isPersonal) {
                return (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(var(--glow-amber-rgb)/0.1)]">
                    Importación Express
                  </span>
                );
              }
              if (isInDb) {
                return (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal/20 text-teal border border-teal/30 shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.1)]">
                    Entrega Inmediata
                  </span>
                );
              }
              if (item.isImportation) {
                return (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500/90 border border-amber-500/20">
                    Importación
                  </span>
                );
              }
              return null;
            })()
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <p
            className={`font-black text-sm tabular-nums ${isOutOfStock ? 'text-red-500/50 line-through' : 'text-teal'}`}
          >
            {formatPrice(item.price)}
          </p>
          {!isOutOfStock && (
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
              MXN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
