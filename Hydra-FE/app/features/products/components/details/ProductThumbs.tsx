'use client';

import Image from 'next/image';
import { FlowButton } from '@/features/shared/ui/flow-button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/features/shared/ui/carousel';
import type { ProductThumbsProps } from '../../types';

export function ProductThumbs({
  images,
  productName,
  currentIndex,
  goTo,
  setThumbsApi,
}: ProductThumbsProps) {
  return (
    <div className="w-full max-w-lg px-8">
      <Carousel setApi={setThumbsApi} opts={{ align: 'start', loop: false }} className="w-full">
        <CarouselContent className="-ml-2">
          {images.map((img, index) => (
            <CarouselItem key={img} className="pl-2 basis-1/4">
              <FlowButton
                variant="ghost"
                simple
                onClick={() => goTo(index)}
                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all p-0 h-auto ${
                  currentIndex === index
                    ? 'border-primary ring-2 ring-primary/20 opacity-100'
                    : 'border-transparent hover:border-zinc-300 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName} - Miniatura ${index + 1} | Hydra Collectables`}
                  fill
                  className="object-contain"
                  sizes="100px"
                />
              </FlowButton>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-8" />
        <CarouselNext className="-right-8" />
      </Carousel>
    </div>
  );
}
