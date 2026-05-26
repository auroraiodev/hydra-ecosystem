'use client';

import React from 'react';
import Image from 'next/image';
import { Box24Regular, Tag24Regular, Delete24Regular, Edit24Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import type { AddProductData } from '../../types';

interface ProductItemCardProps {
  item: AddProductData;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<AddProductData>) => void;
}

export function ProductItemCard({
  item,
  index,
  onRemove,
  onUpdate,
}: ProductItemCardProps) {
  const isPending = item._isPending === true;

  return (
    <div
      className={`p-4 border rounded-lg transition-colors dark:border-zinc-700 ${
        isPending
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : 'hover:bg-muted/50'
      }`}
    >
      {isPending && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
            PENDIENTE DE REVISIÓN
          </span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="size-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-zinc-300 dark:border-zinc-600">
          {item.imageUrl && item.imageUrl.trim() !== '' ? (
            <Image
              src={item.imageUrl}
              alt={item.name || 'Product image'}
              fill
              sizes="80px"
              className="object-contain p-1"
              unoptimized
            />
          ) : (
            <Box24Regular className="size-8 text-zinc-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <h4 className="font-semibold text-base truncate">{item.name}</h4>
            {item.title && item.title !== item.name && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {item.title}
              </p>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              ${item.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm text-muted-foreground">
              Stock: <span className="font-medium">{item.inStock || 1}</span>
            </span>
            <button
              type="button"
              onClick={() => onUpdate(index, { isFoil: !item.isFoil })}
              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                item.isFoil
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600'
              }`}
              title={item.isFoil ? 'Quitar Foil' : 'Marcar como Foil'}
            >
              {item.isFoil ? 'Foil ✓' : 'Normal'}
            </button>
            {item.isBorderless && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium">
                Borderless
              </span>
            )}
            {item.extendedArt && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
                Extended Art
              </span>
            )}
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md"
                >
                  <Tag24Regular className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isPending ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdate(index, { _isPending: false, _bulkImportId: undefined })}
                className="bg-green-600 hover:bg-green-700 text-white"
                title="Aceptar"
              >
                ✓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="p-2 size-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Rechazar"
              >
                <Delete24Regular className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(index, item)}
                className="p-2 size-8"
                title="Editar"
              >
                <Edit24Regular className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="p-2 size-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Eliminar"
              >
                <Delete24Regular className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
