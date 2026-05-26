'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cart24Regular } from '@fluentui/react-icons';
import { SafeImg } from '@/components/ui/safe-img';

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

  if (!src || src.trim() === '') {
    return (
      <div className={`${className} bg-muted rounded border flex items-center justify-center`}>
        {fallbackIcon || <Cart24Regular className="size-6 text-muted-foreground opacity-20" />}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger>
        <div
          className={`${className} bg-muted rounded border cursor-zoom-in hover:opacity-80 transition-opacity overflow-hidden flex items-center justify-center`}
        >
          <SafeImg src={src ?? undefined} alt={alt} className="size-full object-contain" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative aspect-[3/4] w-full max-h-[80vh] flex items-center justify-center p-4">
          <SafeImg
            src={src ?? undefined}
            alt={alt}
            className="size-full object-contain drop-shadow-2xl rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
