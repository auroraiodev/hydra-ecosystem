'use client';

import Image from 'next/image';
import { Box24Regular } from '@fluentui/react-icons';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form-field';

interface ProductFormPreviewProps {
  imageUrl: string;
  cardName: string;
}

export function ProductFormPreview({ imageUrl, cardName }: ProductFormPreviewProps) {
  return (
    <FormItem>
      <FormLabel>Vista Previa</FormLabel>
      <FormControl>
        <div className="border border-border rounded-lg bg-muted/50 p-4 flex items-center justify-center min-h-[400px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={cardName || 'Card preview'}
              width={300}
              height={500}
              className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.png';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Box24Regular className="size-16 mb-4 opacity-50" />
              <p className="text-sm">
                Ingresa una URL de imagen para ver la vista previa
              </p>
            </div>
          )}
        </div>
      </FormControl>
    </FormItem>
  );
}
