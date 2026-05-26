import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { LoadingIcon } from '@/features/shared/components/LoadingIcon';
import { type CarouselApi } from '@/features/shared/ui/carousel';
import { useCustomCarousel } from '@/features/shared';
import { ProductThumbs } from './ProductThumbs';
import type { ProductGalleryProps } from '../../types';

export function ProductGallery({ images, productName, isFoil }: ProductGalleryProps) {
  const [thumbsApi, setThumbsApi] = useState<CarouselApi>();
  const [loadedIndices, setLoadedIndices] = useState<Record<number, boolean>>({});
  const [errorIndices, setErrorIndices] = useState<Record<number, boolean>>({});

  const { currentIndex, next, prev, goTo, pause, resume } = useCustomCarousel({
    totalSlides: images.length,
    autoplayInterval: 5000,
    autoplay: false,
    onIndexChange: (index) => {
      if (thumbsApi) thumbsApi.scrollTo(index);
    },
  });

  return (
    <div className="bg-white/5 p-8 flex flex-col items-center justify-center relative group">
      <div
        className="relative w-full max-w-sm shadow-2xl rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center mb-4 group/carousel aspect-[5/7]"
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        <div className="relative size-full rounded-lg overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {images.map(
              (img, index) =>
                index === currentIndex && (
                  <m.div
                    key={img}
                    className="absolute inset-0 size-full flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    {!loadedIndices[index] && !errorIndices[index] && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <LoadingIcon size="lg" />
                      </div>
                    )}
                    {errorIndices[index] ? (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 font-medium">
                        Sin imagen
                      </div>
                    ) : (
                      <Image
                        src={img}
                        alt={`${productName} - Vista detallada ${index + 1} de Magic México | Hydra`}
                        fill
                        sizes="(max-width: 768px) calc(100vw - 96px), (max-width: 1024px) 45vw, 30vw"
                        className={`object-contain transition-opacity duration-500 ${
                          loadedIndices[index] ? 'opacity-100' : 'opacity-0'
                        }`}
                        priority={index === 0}
                        onLoad={() => setLoadedIndices((prev) => ({ ...prev, [index]: true }))}
                        onError={() => {
                          setLoadedIndices((prev) => ({ ...prev, [index]: true }));
                          setErrorIndices((prev) => ({ ...prev, [index]: true }));
                        }}
                      />
                    )}
                  </m.div>
                )
            )}
          </AnimatePresence>

          {images.length === 0 && (
            <div className="size-full flex items-center justify-center bg-white/5">
              <span className="text-white/40 font-medium">Sin imagen</span>
            </div>
          )}

          {isFoil && <ShaderAnimation />}

          {images.length > 1 && (
            <>
              <FlowButton
                variant="ghost"
                size="icon"
                simple
                onClick={(e) => {
                  e.preventDefault();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white z-20 backdrop-blur-sm transition-opacity opacity-0 group-hover/carousel:opacity-100 size-10 min-w-0 border-0"
              >
                <ChevronLeft className="size-6" />
              </FlowButton>
              <FlowButton
                variant="ghost"
                size="icon"
                simple
                onClick={(e) => {
                  e.preventDefault();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white z-20 backdrop-blur-sm transition-opacity opacity-0 group-hover/carousel:opacity-100 size-10 min-w-0 border-0"
              >
                <ChevronRight className="size-6" />
              </FlowButton>
            </>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <ProductThumbs
          images={images}
          productName={productName}
          currentIndex={currentIndex}
          goTo={goTo}
          setThumbsApi={setThumbsApi}
        />
      )}
    </div>
  );
}
