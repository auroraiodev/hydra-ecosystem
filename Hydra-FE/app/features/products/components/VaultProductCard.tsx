'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { LazyMotion, domAnimation, m as motion } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { CardData } from '../types/EnhancedCard.types';
import { VaultProductBadges } from '@/features/shared/ui';
import { fetchValuedPrice } from '@/features/products/utils/api';
import { normalizePrice } from '@/lib/utils/transformers';

interface VaultProductCardProps {
  card: CardData;
  priority?: boolean;
}

export function VaultProductCard({ card, priority = false }: VaultProductCardProps) {
  const { isAuthenticated } = useAuth();
  const [displayPrice, setDisplayPrice] = useState(card.price);

  useEffect(() => {
    setDisplayPrice(card.price);
    const numericPrice = parseFloat(card.price?.replace(/[^0-9.-]+/g, '')) || 0;
    if (numericPrice <= 0) {
      const refetch = async () => {
        try {
          const productId = card.id || card.importationId;
          if (productId) {
            const fetchedPriceVal = await fetchValuedPrice(
              productId,
              card.title || card.cardName,
              card.language
            );
            if (fetchedPriceVal > 0) {
              setDisplayPrice(normalizePrice(fetchedPriceVal));
            }
          }
        } catch (err) {
          console.error('[VaultProductCard] Error refetching price:', err);
        }
      };
      refetch();
    }
  }, [card.id, card.importationId, card.price, card.title, card.cardName, card.language]);

  const showPrice = displayPrice && displayPrice !== '$0.00 MXN' ? displayPrice : 'Consultar';

  return (
    <LazyMotion features={domAnimation}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="group relative vault-glass-card rounded-xl overflow-hidden h-full flex flex-col"
      >
        {/* Image */}
        <Link href={card.href || '#'} className="block relative aspect-[3/4] overflow-hidden">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="size-full bg-white/5 flex items-center justify-center text-vault-text-muted text-xs">
              Sin imagen
            </div>
          )}
          <VaultProductBadges product={card} className="absolute top-2 left-2 flex-col" />
          {/* Wishlist */}
          {isAuthenticated && (
            <button
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-teal hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Agregar a favoritos"
            >
              <Heart className="size-3.5" />
            </button>
          )}
        </Link>

        {/* Info */}
        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-sm font-medium text-white line-clamp-2 mb-1" title={card.title}>
            {card.title}
          </h3>
          {card.expansion && (
            <p className="text-[11px] text-vault-text-muted truncate mb-1">{card.expansion}</p>
          )}
          <div className="flex items-center gap-1.5 mb-2">
            {card.storeLogo && (
              <div className="relative size-3.5 rounded-full overflow-hidden border border-white/10">
                <Image
                  src={resolveImageUrl(card.storeLogo)}
                  alt={card.soldBy || 'Store'}
                  fill
                  sizes="14px"
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-[10px] text-vault-text-muted font-medium">
              Vendido por <span className="text-teal/80">{card.soldBy || 'Hydra'}</span>
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-sm font-bold text-teal">{showPrice}</span>
            <button
              className="p-1.5 rounded-lg bg-teal/10 text-teal hover:bg-teal hover:text-teal-foreground transition-colors"
              aria-label="Agregar al carrito"
            >
              <ShoppingCart className="size-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </LazyMotion>
  );
}
