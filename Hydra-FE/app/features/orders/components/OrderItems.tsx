import Image from 'next/image';
import { CheckCircle2, Package } from 'lucide-react';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { CONDITION_MAP } from '../constants';
import { ConditionChip } from '@/features/shared/ui';
import type { OrderItemsProps, OrderItem } from '../types';

const EMPTY_ITEMS: OrderItem[] = [];

interface ProductData {
  cardName?: string;
  name?: string;
  title?: string;
  imageUrl?: string;
  img?: string;
  condition?: string;
  foil?: boolean;
}

export function OrderItems({
  items = EMPTY_ITEMS,
  importationItems = EMPTY_ITEMS,
  formatPrice,
}: OrderItemsProps) {
  const allItems = [...items, ...importationItems];

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-body">Productos</h2>
            <p className="text-xs text-text-muted">{allItems.length} artículos en esta orden</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-y-5">
        {allItems.map((item) => {
          const productData = (item.productData || {}) as ProductData;
          const title = String(
            productData.cardName || productData.name || productData.title || 'Producto'
          );
          const imageUrl = String(productData.imageUrl || productData.img || '');
          const rawCondition = productData.condition;
          const condition = rawCondition ? (CONDITION_MAP[rawCondition] ?? rawCondition) : null;

          return (
            <div key={item.id} className="flex gap-4 items-start group">
              <div className="relative w-24 h-32 bg-surface-low rounded-xl overflow-hidden border border-border-subtle shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
                {imageUrl ? (
                  <>
                    <Image src={imageUrl} alt={title} fill sizes="96px" className="object-cover" />
                    {!!productData.foil && <ShaderAnimation />}
                  </>
                ) : (
                  <div className="size-full flex items-center justify-center text-text-muted text-xs font-semibold">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h3 className="font-semibold text-sm leading-tight text-text-body line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {item.isDelivered && (
                    <span className="shrink-0 bg-green-50 dark:bg-green-950/30 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Entregado
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
                  {condition && (
                    <>
                      <ConditionChip condition={condition} />
                      <span className="size-1 rounded-full bg-text-muted/30"></span>
                    </>
                  )}
                  <span>{item.quantity} piezas</span>
                </p>
                <p className="text-xl font-bold text-primary mt-3 tabular-nums">
                  {formatPrice(item.unitPrice)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
