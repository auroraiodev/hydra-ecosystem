'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cart24Regular } from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

interface ProductImageZoomProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function ProductImageZoom({
  src,
  alt = 'Product image',
  className = 'h-16 w-12',
  fallbackIcon,
}: ProductImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const defaultFallback = fallbackIcon || (
    <Cart24Regular className="size-6 text-muted-foreground opacity-20" />
  );

  const resolvedSrc = resolveImageUrl(src);

  return !resolvedSrc || imgError ? (
    <div className={`${className} bg-muted rounded border flex items-center justify-center`}>
      {defaultFallback}
    </div>
  ) : (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={`${className} bg-muted rounded border cursor-zoom-in hover:opacity-80 transition-opacity overflow-hidden flex items-center justify-center`}
        >
          <Image
            src={resolvedSrc}
            alt={alt}
            width={200}
            height={300}
            className="size-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative aspect-[3/4] w-full max-h-[80vh] flex items-center justify-center p-4">
          <Image
            src={resolvedSrc}
            alt={alt}
            width={600}
            height={800}
            className="size-full object-contain drop-shadow-2xl rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
