'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductImageCardProps {
  img: string;
  cardName: string;
  onChange: (value: string) => void;
}

export function ProductImageCard({ img, cardName, onChange }: ProductImageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Imagen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {img ? (
          <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100">
            <Image
              src={img}
              alt={cardName}
              width={300}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="aspect-[3/4] rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
            Sin imagen
          </div>
        )}
        <div>
          <Label htmlFor="img">URL de Imagen</Label>
          <Input
            id="img"
            value={img}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="mt-1 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
