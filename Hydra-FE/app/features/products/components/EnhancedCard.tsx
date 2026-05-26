import { memo } from 'react';
import type { EnhancedCardProps } from '../types';
import { EnhancedCardSingles } from './EnhancedCardSingles';
import { EnhancedCardGrid } from './EnhancedCardGrid';
import { EnhancedCardDefault } from './EnhancedCardDefault';

export const EnhancedCard = memo(function EnhancedCard({
  card,
  variant = 'default',
  className = '',
  onQuickView,
  showWishlist = true,
  showQuickView = true,
  priority = false,
}: EnhancedCardProps) {
  const commonProps = {
    card,
    className,
    onQuickView,
    showWishlist,
    showQuickView,
    priority,
  };

  if (variant === 'singles') {
    return <EnhancedCardSingles {...commonProps} />;
  }

  if (variant === 'grid') {
    return <EnhancedCardGrid {...commonProps} />;
  }

  return <EnhancedCardDefault {...commonProps} />;
});
