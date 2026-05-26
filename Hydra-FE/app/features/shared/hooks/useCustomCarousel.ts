'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCustomCarouselOptions {
  totalSlides: number;
  autoplayInterval?: number;
  autoplay?: boolean;
  onIndexChange?: (index: number) => void;
}

export function useCustomCarousel({
  totalSlides,
  autoplayInterval = 3000,
  autoplay = true,
  onIndexChange,
}: UseCustomCarouselOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = (prev + 1) % totalSlides;
      onIndexChange?.(nextIndex);
      return nextIndex;
    });
  }, [totalSlides, onIndexChange]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = (prev - 1 + totalSlides) % totalSlides;
      onIndexChange?.(nextIndex);
      return nextIndex;
    });
  }, [totalSlides, onIndexChange]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentIndex(index);
        onIndexChange?.(index);
      }
    },
    [totalSlides, onIndexChange]
  );

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  useEffect(() => {
    if (autoplay && !isPaused && totalSlides > 1) {
      timeoutRef.current = setInterval(next, autoplayInterval);
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [autoplay, isPaused, totalSlides, autoplayInterval, next]);

  return {
    currentIndex,
    next,
    prev,
    goTo,
    pause,
    resume,
    isPaused,
  };
}
