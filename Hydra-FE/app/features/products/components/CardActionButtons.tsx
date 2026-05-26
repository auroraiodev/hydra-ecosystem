import { Heart, Eye } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import type { CardActionButtonsProps } from '../types';

export function CardActionButtons({
  showWishlist = true,
  showQuickView = true,
  isInWishlist,
  onWishlistClick,
  onQuickViewClick,
}: CardActionButtonsProps) {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2 z-30">
      {showWishlist && (
        <FlowButton
          variant={isInWishlist ? 'default' : 'ghost'}
          size="icon"
          onClick={onWishlistClick}
          className={`shadow-md transition-all duration-200 active:scale-90 ${
            isInWishlist
              ? 'bg-red-500 text-white'
              : 'bg-surface text-text-muted hover:bg-red-500/10 hover:text-red-500'
          }`}
          aria-label={isInWishlist ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
        >
          {isInWishlist ? <Heart className="size-4 fill-current" /> : <Heart className="size-4" />}
        </FlowButton>
      )}
      {showQuickView && (
        <FlowButton
          variant="ghost"
          size="icon"
          onClick={onQuickViewClick}
          className="bg-surface shadow-md text-text-muted hover:bg-surface-low hover:text-text-body transition-all duration-200"
          aria-label="Vista rápida"
        >
          <Eye className="size-4" />
        </FlowButton>
      )}
    </div>
  );
}
