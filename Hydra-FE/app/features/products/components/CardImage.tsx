'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CardImageProps } from '../types';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { LoadingIcon } from '@/features/shared/components/LoadingIcon';

export function CardImage({
  imageUrl,
  title,
  foil,
  aspectRatio = 'aspect-[5/7]',
  imageClassName = '',
  priority = false,
}: CardImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!imageUrl) {
    return (
      <div
        className={`${aspectRatio} flex items-center justify-center text-vault-text-muted text-sm bg-black/40 rounded-lg`}
      >
        Sin imagen
      </div>
    );
  }

  return (
    <div className={`relative h-full ${aspectRatio} rounded-lg overflow-hidden group`}>
      <div className="relative size-full cursor-pointer flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-vault-bg/20 backdrop-blur-[2px]">
            <LoadingIcon size="md" />
          </div>
        )}

        <Image
          src={resolveImageUrl(imageUrl)}
          alt={title}
          fill
          className={`cursor-pointer transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } object-contain mix-blend-multiply ${imageClassName}`}
          sizes="(max-width: 639px) 45vw, (max-width: 1023px) 25vw, (max-width: 1535px) 20vw, 15vw"
          quality={60}
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoading(false)}
        />
      </div>
      {foil === true && !isLoading && <ShaderAnimation />}
    </div>
  );
}
