'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReviewModal } from '@/features/reviews';

import { ORDER_STATUS_CONFIG, DEFAULT_STATUS_CONFIG } from '../constants';
import { type OrderCardProps } from '../types';

const PRICE_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function OrderCard({ order: initialOrder }: OrderCardProps) {
  const initialOrderMemo = useMemo(() => initialOrder, [initialOrder]);
  const [order, setOrder] = useState(initialOrderMemo);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || DEFAULT_STATUS_CONFIG;

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return PRICE_FORMATTER.format(numPrice);
  };

  // Get first 3 items for preview
  const previewItems = [...(order.items || []), ...(order.importationItems || [])].slice(0, 3);
  const remainingCount = Math.max(
    0,
    (order.items?.length || 0) + (order.importationItems?.length || 0) - 3
  );

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="block glass-panel ghost-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all group shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-text-body">Orden #{order.id.slice(0, 8)}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusConfig.color}`}
              >
                {statusConfig.text}
              </span>
            </div>
            <p className="text-xs text-text-muted" suppressHydrationWarning>
              {formattedDate}
            </p>
          </div>
          <p className="font-bold text-primary">{formatPrice(order.total)}</p>
        </div>

        {/* Items Preview */}
        <div className="flex gap-2">
          {previewItems.map((item, index) => {
            const productData = (item.productData || {}) as Record<string, unknown>;
            const imageUrl = String(productData.imageUrl || productData.img || '');
            const stableId = item.id || `preview-${item.productData?.id || index}`;

            return (
              <div
                key={stableId}
                className="relative w-12 h-16 bg-surface-low rounded-md overflow-hidden border border-white/5 shrink-0"
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Product preview"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] text-text-muted">
                    N/A
                  </div>
                )}
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div className="w-12 h-16 bg-surface-low rounded-md border border-white/5 shrink-0 flex items-center justify-center text-xs font-medium text-text-muted">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/[0.03] px-4 py-2 flex items-center justify-between text-xs font-medium text-text-muted group-hover:text-primary transition-colors border-t border-white/5">
        <div className="flex items-center gap-4">
          <Link href={`/profile/orders/${order.id}`} className="flex items-center gap-1">
            <span>Ver detalles</span>
            <ChevronRight className="size-4" />
          </Link>

          {order.review_requested && !order.has_review && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsReviewModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-bold uppercase tracking-wider text-[9px]"
            >
              <Star className="size-3 fill-current" />
              Dejar Reseña
            </button>
          )}

          {order.has_review && (
            <div className="flex items-center gap-1 text-green-400 font-bold uppercase tracking-wider text-[9px]">
              <Star className="size-3 fill-current" />
              Reseña Enviada
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        orderId={order.id}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => {
          setOrder((prev: typeof order) => ({ ...prev, has_review: true }));
        }}
      />
    </div>
  );
}
