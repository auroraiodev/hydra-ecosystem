'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { type CardData } from '@/features/products/types';

interface MobileQuickViewProps {
  modalRef: React.RefObject<HTMLDivElement | null>;
  displayTitle: string;
  displayImages: (string | undefined)[];
  selectedImage: number;
  card: CardData;
  badgesBlock: React.ReactNode;
  detailsBlock: React.ReactNode;
  onClose: () => void;
}

export function MobileQuickView({
  modalRef,
  displayTitle,
  displayImages,
  selectedImage,
  card,
  badgesBlock,
  detailsBlock,
  onClose,
}: MobileQuickViewProps) {
  return (
    <div
      ref={modalRef}
      className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title-mobile"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/30 flex-shrink-0">
        <h2
          id="quick-view-title-mobile"
          className="font-semibold text-base text-text-body truncate pr-2"
        >
          {displayTitle}
        </h2>
        <FlowButton
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="p-2 text-text-muted hover:text-primary transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </FlowButton>
      </div>
      <div className="flex-shrink-0 bg-surface-low px-4 pt-4 pb-2">
        <div className="relative h-52 overflow-hidden rounded-2xl bg-surface shadow-sm">
          {displayImages[selectedImage] ? (
            <Image
              src={displayImages[selectedImage]!}
              alt={displayTitle}
              fill
              className="object-contain"
              sizes="calc(100vw - 32px)"
              quality={85}
              priority
            />
          ) : (
            <div className="size-full flex items-center justify-center text-text-muted text-sm">
              Sin imagen
            </div>
          )}
          {card.foil === true && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <ShaderAnimation />
            </div>
          )}
        </div>
        <div className="mt-2">{badgesBlock}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">{detailsBlock}</div>
    </div>
  );
}
