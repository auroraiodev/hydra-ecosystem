import { memo } from 'react';
import { EnhancedCard } from '@/features/products/components';
import { CardSkeleton } from '@/features/shared/ui/CardSkeleton';
import { VaultSectionHeader } from '@/features/tcg-home/components/VaultSectionHeader';
import type { ProductSectionProps } from '../types';

export const ProductSection = memo(function ProductSection({
  title,
  href,
  cards,
  loading = false,
  error = null,
  onQuickView,
  className = '',
  priority = false,
  icon,
}: ProductSectionProps) {
  if (loading) {
    return (
      <div className={`px-4 lg:px-0 ${className}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6">
          <CardSkeleton count={4} variant="singles" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`px-4 lg:px-0 text-center py-8 lg:py-12 ${className}`}>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className={`px-4 lg:px-0 pt-10 pb-6 ${className}`}>
      <VaultSectionHeader title={title} href={href} icon={icon} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 pt-2">
        {cards.slice(0, 4).map((cardData) => (
          <EnhancedCard
            key={cardData.id}
            card={cardData}
            variant="grid"
            onQuickView={onQuickView}
            priority={priority}
          />
        ))}
      </div>
    </div>
  );
});
