'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { type CardData } from '@/features/products/types';

interface DesktopQuickViewProps {
  displayTitle: string;
  displayImages: (string | undefined)[];
  selectedImage: number;
  card: CardData;
  badgesBlock: React.ReactNode;
  detailsBlock: React.ReactNode;
  onClose: () => void;
  handleBackdropClick: (e: React.MouseEvent) => void;
  handleBackdropKeyDown: (e: React.KeyboardEvent) => void;
}

export function DesktopQuickView({
  displayTitle,
  displayImages,
  selectedImage,
  card,
  badgesBlock,
  detailsBlock,
  onClose,
  handleBackdropClick,
  handleBackdropKeyDown,
}: DesktopQuickViewProps) {
  return (
    <div
      className="hidden lg:flex fixed inset-0 z-50 items-center justify-center bg-black/50 backdrop-blur-sm p-4 cursor-pointer"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Cerrar vista rápida"
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-row transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title-desktop"
        tabIndex={-1}
      >
        <div className="w-1/2 bg-surface-low p-6 relative">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface shadow-sm">
            {displayImages[selectedImage] ? (
              <Image
                src={displayImages[selectedImage]!}
                alt={displayTitle}
                fill
                className="object-contain"
                sizes="45vw"
                quality={85}
                priority
              />
            ) : (
              <div className="aspect-square flex items-center justify-center text-zinc-400">
                Sin imagen
              </div>
            )}
            {card.foil === true && (
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <ShaderAnimation />
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <FlowButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="p-2 glass-panel rounded-lg shadow-md text-text-muted hover:text-primary transition-colors"
              aria-label="Cerrar vista rápida"
            >
              <X className="size-5" />
            </FlowButton>
          </div>
        </div>
        <div className="w-1/2 flex flex-col overflow-y-auto">
          <div className="p-6 pb-0">
            <h2 id="quick-view-title-desktop" className="text-xl font-semibold text-text-body mb-3">
              {displayTitle}
            </h2>
            {badgesBlock}
          </div>
          <div className="flex-1 p-6 overflow-y-auto">{detailsBlock}</div>
        </div>
      </div>
    </div>
  );
}
