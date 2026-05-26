'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SafeImg } from '@/components/ui/safe-img';
import {
  Checkmark24Regular,
  FastForward24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { type ApiProduct, productName, productDetail } from '../types';

interface CountingCardProps {
  product: ApiProduct;
  index: number;
  total: number;
  onConfirm: (physicalStock: number) => void;
  onSkip: () => void;
}

export function CountingCard({
  product,
  index,
  total,
  onConfirm,
  onSkip,
}: CountingCardProps) {
  const [inputValue, setInputValue] = useState(String(product.stock));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => setInputValue(String(product.stock)));
    const timer = setTimeout(() => inputRef.current?.select(), 50);
    return () => clearTimeout(timer);
  }, [product.id, product.stock]);

  const handleConfirmSame = () => onConfirm(product.stock);
  const handleConfirmInput = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 0) return;
    onConfirm(val);
  };

  const physicalVal = parseInt(inputValue, 10);
  const diff = isNaN(physicalVal) ? null : physicalVal - product.stock;
  const isDifferent = diff !== null && diff !== 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-full max-w-xl space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Carta {index + 1} de {total}
          </span>
          <span>{Math.round((index / total) * 100)}% completado</span>
        </div>
        <Progress value={(index / total) * 100} className="h-2" />
      </div>

      <div className="w-full max-w-xl">
        <Card className="overflow-hidden border-primary/5 shadow-sm">
          <div className="flex gap-0">
            <div
              className="shrink-0 bg-muted/30 flex items-center justify-center p-4"
              style={{ width: 140 }}
            >
              <SafeImg
                src={product.img}
                alt={productName(product)}
                className="h-36 w-auto object-contain rounded-md shadow-md"
              />
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-lg font-semibold leading-tight">{productName(product)}</h2>
                  <div className="flex gap-1 shrink-0">
                    {product.foil && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        Foil
                      </Badge>
                    )}
                    {product.surgeFoil && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 border-purple-400 text-purple-600"
                      >
                        Surge Foil
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{productDetail(product)}</p>
                {product.categories?.display_name && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {product.categories.display_name}
                  </Badge>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                  Sistema registra
                </p>
                <span className="text-3xl font-bold tabular-nums">{product.stock}</span>
                <span className="text-muted-foreground text-sm ml-1">
                  unidad{product.stock !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/30 p-5">
            <p className="text-sm font-medium mb-3">¿Cuántas hay físicamente?</p>
            <div className="flex items-center gap-3">
              <Input
                ref={inputRef}
                type="number"
                min={0}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmInput();
                }}
                className={cn(
                  'w-24 text-center text-xl font-bold h-12',
                  isDifferent && 'border-orange-400 ring-1 ring-orange-300',
                  diff === 0 && 'border-green-400 ring-1 ring-green-300'
                )}
              />
              {diff !== null && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-semibold',
                    diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-destructive' : 'text-green-600'
                  )}
                >
                  {diff === 0 ? (
                    <>
                      <CheckmarkCircle24Regular className="size-4" /> Sin diferencia
                    </>
                  ) : diff > 0 ? (
                    <>
                      <Warning24Regular className="size-4" /> +{diff} excedente
                    </>
                  ) : (
                    <>
                      <DismissCircle24Regular className="size-4" /> {diff} faltante
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirmSame}
              >
                <CheckmarkCircle24Regular className="size-4 mr-2" />
                Igual ({product.stock})
              </Button>
              <Button
                variant={isDifferent ? 'default' : 'outline'}
                className="flex-1"
                onClick={handleConfirmInput}
                disabled={isNaN(physicalVal) || physicalVal < 0}
              >
                <Checkmark24Regular className="size-4 mr-2" />
                Confirmar ({isNaN(physicalVal) ? '?' : physicalVal})
              </Button>
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                <FastForward24Regular className="size-4 mr-1" />
                Saltar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        <kbd className="border rounded px-1">Enter</kbd> confirma el número ingresado
      </p>
    </div>
  );
}
