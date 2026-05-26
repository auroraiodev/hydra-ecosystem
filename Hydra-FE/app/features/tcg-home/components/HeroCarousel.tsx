'use client';

import { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { useBanners } from '../hooks/useBanners';
import { type HeroCarouselProps } from '../types';
import { CAROUSEL_AUTOPLAY_DELAY } from '../constants';

export function HeroCarousel({ tcgId }: HeroCarouselProps) {
  const { banners, isLoading, error } = useBanners(tcgId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, CAROUSEL_AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (isLoading) {
    return (
      <div className="relative w-full aspect-[5/3] lg:aspect-[5/2] rounded-2xl overflow-hidden">
        <Skeleton vault className="size-full" />
      </div>
    );
  }

  if (error) {
    console.error(`[HeroCarousel] Error loading banners for ${tcgId}:`, error);
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const primaryHref =
    currentBanner.link_url?.replace(/^\/magic(\/|$)/, '/mtg$1') || '/singles/search';

  return (
    <div className="relative w-full aspect-[5/3] lg:aspect-[5/2] rounded-2xl overflow-hidden group shadow-2xl">
      <AnimatePresence mode="wait">
        <m.div
          key={currentBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Mobile-only absolute link overlay */}
          <Link
            href={primaryHref}
            className="lg:hidden absolute inset-0 z-20"
            aria-label={currentBanner.title || 'Banner'}
          />

          <picture className="size-full">
            {currentBanner.mobile_image_url && (
              <source
                media="(max-width: 768px)"
                srcSet={resolveImageUrl(currentBanner.mobile_image_url)}
              />
            )}
            <Image
              src={resolveImageUrl(currentBanner.image_url) || '/images/placeholder-banner.jpg'}
              alt={currentBanner.title || 'Banner'}
              fill
              sizes="100vw"
              className="object-cover"
              priority
              fetchPriority="high"
            />
          </picture>

          {(currentBanner.title || currentBanner.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 lg:p-12 z-10">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentBanner.title && (
                  <h2 className="text-white text-2xl lg:text-5xl font-semibold mb-2 drop-shadow-lg leading-tight">
                    {currentBanner.title}
                  </h2>
                )}
                {currentBanner.subtitle && (
                  <p className="text-white/80 text-sm lg:text-xl font-medium drop-shadow-md mb-6 line-clamp-2 lg:line-clamp-none">
                    {currentBanner.subtitle}
                  </p>
                )}
                <div className="hidden lg:flex gap-3 flex-wrap">
                  <FlowButton
                    asChild
                    size="lg"
                    variant="default"
                    className="h-12 lg:h-14 px-6 rounded-xl shadow-xl shadow-black/30"
                    showArrows
                  >
                    <Link href={primaryHref}>
                      <span className="font-black uppercase tracking-wider">Explorar Singles</span>
                    </Link>
                  </FlowButton>
                  <FlowButton
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-12 lg:h-14 px-6 rounded-xl font-bold uppercase tracking-wider text-white border-white/30 hover:bg-white/10"
                  >
                    <Link href="/sell">Vender Cartas</Link>
                  </FlowButton>
                </div>
              </m.div>
            </div>
          )}
        </m.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="size-6 lg:w-8 lg:h-8" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="size-6 lg:w-8 lg:h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((banner, idx) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(idx)}
                className={`size-2 lg:w-3 lg:h-3 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-6 lg:w-8' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
