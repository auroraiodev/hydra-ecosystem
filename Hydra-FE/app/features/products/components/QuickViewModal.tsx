'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCart } from '@/features/cart';
import { useToast } from '@/features/shared';
import { useWishlist } from '@/features/products';
import { useAuth } from '@/features/auth';
import { type QuickViewModalProps } from '@/features/products/types';
import { resolveLanguageName } from '@/lib/utils/transformers';
import { QuickViewBadges } from './QuickViewBadges';
import { QuickViewDetails } from './QuickViewDetails';
import { MobileQuickView } from './MobileQuickView';
import { DesktopQuickView } from './DesktopQuickView';

export function QuickViewModal({ card, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const { success } = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [isOpen]
  );
  handleKeyDownRef.current = handleKeyDown;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDownRef.current?.(e);

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handler);

      if (modalRef.current) {
        setTimeout(() => {
          const focusable = modalRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }, 10);
      }
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen]);

  if (!card || !isOpen) return null;

  const displayTitle = card.cardName || card.title;
  const displayImages = [card.imageUrl];
  const languageDisplay = resolveLanguageName(card.language) || 'Inglés';
  const hasPersonalMetadata =
    card.metadata?.includes('Personal') ||
    card.tags?.some((t) => t === 'Personal' || t === 'personal') ||
    false;
  const isImportationImport = !!card.importationId && !card.isLocalInventory;
  const isBundle =
    card.isBundle ||
    card.title?.toLowerCase().includes('bundle') ||
    card.metadata?.includes('Bundle');
  const showImportacionBadge = (hasPersonalMetadata || isImportationImport) && !isBundle;
  const showImmediateDelivery =
    card.immediateDelivery ||
    card.isLocalInventory ||
    isBundle ||
    (!hasPersonalMetadata && !isImportationImport);

  const handleAddToCart = async () => {
    if (isAdding || (card.stock !== undefined && card.stock <= 0)) return;
    setIsAdding(true);
    try {
      await addToCart(card, 1);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  const badgesBlock = (
    <QuickViewBadges
      card={card}
      showImmediateDelivery={showImmediateDelivery}
      showImportacionBadge={showImportacionBadge}
    />
  );
  const detailsBlock = (
    <QuickViewDetails
      card={card}
      displayTitle={displayTitle}
      languageDisplay={languageDisplay}
      isAdding={isAdding}
      handleAddToCart={handleAddToCart}
      isAuthenticated={isAuthenticated}
      isInWishlist={isInWishlist}
      toggleWishlist={toggleWishlist}
      success={success}
      onClose={onClose}
    />
  );

  return (
    <>
      <MobileQuickView
        modalRef={modalRef}
        displayTitle={displayTitle}
        displayImages={displayImages}
        selectedImage={selectedImage}
        card={card}
        badgesBlock={badgesBlock}
        detailsBlock={detailsBlock}
        onClose={onClose}
      />
      <DesktopQuickView
        displayTitle={displayTitle}
        displayImages={displayImages}
        selectedImage={selectedImage}
        card={card}
        badgesBlock={badgesBlock}
        detailsBlock={detailsBlock}
        onClose={onClose}
        handleBackdropClick={handleBackdropClick}
        handleBackdropKeyDown={handleBackdropKeyDown}
      />
    </>
  );
}
