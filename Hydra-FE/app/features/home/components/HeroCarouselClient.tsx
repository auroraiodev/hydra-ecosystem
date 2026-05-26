'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/features/shared/ui/skeleton';

const HeroCarousel = dynamic(
  () => import('@/features/tcg-home/components/HeroCarousel').then((m) => m.HeroCarousel),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full aspect-[5/3] lg:aspect-[5/2] rounded-2xl overflow-hidden">
        <Skeleton vault className="size-full" />
      </div>
    ),
  }
);

export function HeroCarouselClient({ tcgId }: { tcgId: string }) {
  return <HeroCarousel tcgId={tcgId} />;
}
