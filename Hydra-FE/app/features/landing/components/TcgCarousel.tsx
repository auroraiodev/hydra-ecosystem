'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { TcgApiResponse } from '@/features/tcg/types';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { TcgCard } from './TcgCard';

interface TcgCarouselProps {
  tcgs: TcgApiResponse[];
}

export function TcgCarousel({ tcgs }: TcgCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const { push } = useRouter();

  const getCardsPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 5;
    const width = window.innerWidth;
    if (width < 640) return 2;
    if (width < 1024) return 4;
    return 5;
  }, []);

  const getCardsPerPageRef = useRef(getCardsPerPage);
  getCardsPerPageRef.current = getCardsPerPage;

  const totalPages = Math.max(1, Math.ceil(tcgs.length / getCardsPerPage()));

  const scrollToPage = useCallback((page: number) => {
    if (!scrollRef.current) return;
    const cardWidth = window.innerWidth < 640 ? 180 : 220;
    const gap = 16;
    const cardsPerPage = getCardsPerPageRef.current();
    scrollRef.current.scrollTo({
      left: page * (cardWidth + gap) * cardsPerPage,
      behavior: 'smooth',
    });
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const cardWidth = window.innerWidth < 640 ? 180 : 220;
      const gap = 16;
      const cardsPerPage = getCardsPerPageRef.current();
      const page = Math.round(el.scrollLeft / ((cardWidth + gap) * cardsPerPage));
      setCurrentPage(Math.min(page, totalPages - 1));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  const handleCardClick = (tcg: TcgApiResponse) => {
    const slug = tcgNameToSlug(tcg.name);
    push(`/${slug}`);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Arrows */}
      <button
        onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex size-10 items-center justify-center rounded-full vault-glass-panel text-white hover:bg-white/10 transition-all disabled:opacity-30 -translate-x-1/2 shadow-lg ${isHovering && currentPage > 0 ? 'scale-100 opacity-100' : 'md:scale-90 md:opacity-70'} `}
        aria-label="Anterior"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage >= totalPages - 1}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex size-10 items-center justify-center rounded-full vault-glass-panel text-white hover:bg-white/10 transition-all disabled:opacity-30 translate-x-1/2 shadow-lg ${isHovering && currentPage < totalPages - 1 ? 'scale-100 opacity-100' : 'md:scale-90 md:opacity-70'} `}
        aria-label="Siguiente"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 -mx-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {tcgs.map((tcg, i) => (
          <div key={tcg.id} className="snap-start">
            <TcgCard tcg={tcg} onClick={() => handleCardClick(tcg)} index={i} />
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentPage ? 'w-6 bg-teal' : 'w-2 bg-white/20 hover:bg-white/30'
              }`}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
