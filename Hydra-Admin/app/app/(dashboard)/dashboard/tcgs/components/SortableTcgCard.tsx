'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit24Regular,
  Delete24Regular,
  ReOrder24Regular,
} from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tcg } from '../types';

const ACCENT_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-green-100 text-green-800',
  'bg-pink-100 text-pink-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
];

interface SortableTcgCardProps {
  tcg: Tcg;
  idx: number;
  onEdit: (t: Tcg) => void;
  onToggle: (t: Tcg) => void;
  onDelete: (t: Tcg) => void;
}

export function SortableTcgCard({
  tcg,
  idx,
  onEdit,
  onToggle,
  onDelete,
}: SortableTcgCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tcg.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`relative overflow-hidden border h-full flex flex-col ${!tcg.is_active ? 'opacity-60' : ''} ${isDragging ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : ''}`}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${ACCENT_COLORS[idx % ACCENT_COLORS.length].split(' ')[0]}`}
        />
        <CardContent className="pt-5 pb-4 px-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-center gap-3">
              <button
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                {...attributes}
                {...listeners}
              >
                <ReOrder24Regular className="size-4" />
              </button>

              {tcg.icon_url && (
                <div className="size-10 rounded border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                  <Image
                    src={resolveImageUrl(tcg.icon_url)}
                    alt={tcg.display_name}
                    width={40}
                    height={40}
                    className="size-full object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-base truncate">{tcg.display_name}</p>
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  {tcg.name}
                </code>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                variant={tcg.is_active ? 'default' : 'outline'}
                className={
                  tcg.is_active
                    ? 'bg-green-100 text-green-800 border-none'
                    : 'text-muted-foreground'
                }
              >
                {tcg.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <div className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border flex items-center gap-1">
                POS: <span className="text-foreground">{tcg.order}</span>
              </div>
            </div>
          </div>

          {tcg._count != null && (
            <p className="text-xs text-muted-foreground mt-3 space-x-2">
              <span>
                <span className="font-medium text-foreground">{tcg._count.categories}</span> categor
                {tcg._count.categories !== 1 ? 'ías' : 'ía'}
              </span>
              <span>·</span>
              <span>
                <span className="font-medium text-foreground">{tcg._count.singles}</span> producto
                {tcg._count.singles !== 1 ? 's' : ''}
              </span>
            </p>
          )}

          <div className="flex items-center gap-1 mt-auto pt-3 border-t">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onToggle(tcg)}>
              {tcg.is_active ? 'Desactivar' : 'Activar'}
            </Button>

            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(tcg)}>
                <Edit24Regular className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(tcg)}
              >
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
