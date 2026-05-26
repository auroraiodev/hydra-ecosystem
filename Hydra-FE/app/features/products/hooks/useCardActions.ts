import { useState } from 'react';
import type { CardData } from '@/features/products/types';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { useToast } from '@/features/shared';
import { resolveLanguageCode } from '@/lib/utils/transformers';
import { useWishlist } from './useWishlist';
import { useRecentlyViewed } from './useRecentlyViewed';

export function useCardActions(card: CardData, onQuickView?: (card: CardData) => void) {
  const { addToCart } = useCart();
  const { success, error } = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { isAuthenticated } = useAuth();

  const [isHovered, setIsHovered] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const displayTitle = card.cardName || card.title;
  const displaySubtitle =
    card.expansion && card.variant && card.variant !== card.expansion
      ? `${card.expansion} ${card.variant}`
      : card.expansion || card.variant;
  const displayCardNumber = card.cardNumber;

  let finalHref = card.href;
  if (card.href) {
    const params = new URLSearchParams();
    if (card.importationId) params.set('importationId', card.importationId);
    if (card.title) params.set('name', card.title);
    if (card.price) params.set('price', card.price.replace(/[^0-9.]/g, ''));
    if (card.imageUrl) params.set('img', card.imageUrl);
    if (card.stock) params.set('stock', card.stock.toString());
    if (card.isLocalInventory !== undefined)
      params.set('isLocalInventory', card.isLocalInventory.toString());
    if (card.expansion) params.set('expansion', card.expansion);
    if (card.variant) params.set('variant', card.variant);
    if (card.condition) params.set('condition', card.condition);
    if (card.language) params.set('language', resolveLanguageCode(card.language));
    const separator = card.href.includes('?') ? '&' : '?';
    finalHref = `${card.href}${separator}${params.toString()}`;
  }

  const handleCardInteraction = () => {
    addToRecentlyViewed({
      id: card.id,
      title: displayTitle,
      imageUrl: card.imageUrl,
      price: card.price,
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (card.stock !== undefined && card.stock <= 0) return;
    setIsActionLoading(true);
    try {
      await addToCart(card, 1);
    } catch (err) {
      console.error('Error adding to cart:', err);
      error(`No se pudo agregar "${displayTitle}" al carrito`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(card.id);
    toggleWishlist(card.id);
    success(
      wasInWishlist
        ? `"${displayTitle}" eliminado de favoritos`
        : `"${displayTitle}" agregado a favoritos`
    );
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCardInteraction();
    if (onQuickView) onQuickView(card);
  };

  return {
    displayTitle,
    displaySubtitle,
    displayCardNumber,
    finalHref,
    isHovered,
    setIsHovered,
    isInWishlist,
    isActionLoading,
    isAuthenticated,
    handleCardInteraction,
    handleAddToCart,
    handleWishlistToggle,
    handleQuickView,
  };
}
