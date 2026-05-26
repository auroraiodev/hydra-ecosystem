'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/features/shared/ui/carousel';
import { EnhancedCard } from './EnhancedCard';
import { CardSkeleton } from '@/features/shared/ui';
import type { CardData } from '../types';

interface ProductCarouselProps {
  cards: CardData[];
  loading?: boolean;
  variant?: 'singles' | 'grid';
}

export function ProductCarousel({
  cards,
  loading = false,
  variant = 'singles',
}: ProductCarouselProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 lg:px-0">
        <CardSkeleton count={4} variant="vault" />
      </div>
    );
  }

  if (!cards?.length) return null;

  return (
    <div className="relative group/carousel px-0 lg:px-4">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {cards.map((card) => (
            <CarouselItem
              key={card.id}
              className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <EnhancedCard card={card} variant={variant} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons - Hidden on mobile, shown on hover on desktop */}
        <div className="hidden lg:block">
          <CarouselPrevious className="absolute -left-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white" />
          <CarouselNext className="absolute -right-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white" />
        </div>
      </Carousel>
    </div>
  );
}
