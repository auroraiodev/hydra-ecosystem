'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit24Regular,
  Delete24Regular,
  ToggleLeft24Regular,
  Box24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronUpDown24Regular,
} from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  order: number;
  image_url?: string;
  tcgs?: Tcg[];
  _count?: {
    singles: number;
    local_singles?: number;
  };
}

type SortField = 'order' | 'name' | 'display_name' | 'is_active' | 'singles';

function SortIcon({ col, sortField, sortDir }: { col: SortField; sortField: SortField; sortDir: 'asc' | 'desc' }) {
  if (sortField !== col) return <ChevronUpDown24Regular className="size-3.5 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3.5 ml-1" />
    : <ChevronDown24Regular className="size-3.5 ml-1" />;
}

interface CategoriesTableProps {
  categories: Category[];
  onToggle: (cat: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

export function CategoriesTable({
  categories,
  onToggle,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...categories].sort((a, b) => {
      switch (sortField) {
        case 'order': return (a.order - b.order) * dir;
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'display_name': return a.display_name.localeCompare(b.display_name) * dir;
        case 'is_active': return (Number(b.is_active) - Number(a.is_active)) * dir;
        case 'singles': return ((a._count?.singles ?? 0) - (b._count?.singles ?? 0)) * dir;
        default: return 0;
      }
    });
  }, [categories, sortField, sortDir]);

  const thSort = 'p-3 text-left font-semibold cursor-pointer hover:bg-muted select-none';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className={thSort} onClick={() => handleSort('order')}>
              <span className="flex items-center">Orden<SortIcon col="order" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="p-3 text-left font-semibold w-[60px]">Imagen</th>
            <th className={thSort} onClick={() => handleSort('name')}>
              <span className="flex items-center">Código<SortIcon col="name" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('display_name')}>
              <span className="flex items-center">Nombre visible<SortIcon col="display_name" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="p-3 text-left font-semibold">Supracategorías</th>
            <th className={thSort} onClick={() => handleSort('singles')}>
              <span className="flex items-center">Productos (Local/Total)<SortIcon col="singles" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('is_active')}>
              <span className="flex items-center">Estado<SortIcon col="is_active" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="p-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((cat) => (
            <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-3 text-muted-foreground">{cat.order}</td>
              <td className="p-3">
                {cat.image_url ? (
                  <div className="size-8 rounded bg-muted overflow-hidden">
                    <Image
                      src={resolveImageUrl(cat.image_url)}
                      alt=""
                      width={32}
                      height={32}
                      className="size-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="size-8 rounded bg-muted flex items-center justify-center">
                    <Box24Regular className="size-4 text-muted-foreground/40" />
                  </div>
                )}
              </td>
              <td className="p-3">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.name}</code>
              </td>
              <td className="p-3 font-medium">{cat.display_name}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {cat.tcgs && cat.tcgs.length > 0 ? (
                    cat.tcgs.map((t) => (
                      <Badge
                        key={t.id}
                        variant="outline"
                        className="text-[10px] h-5 py-0 px-1.5 bg-primary/5 text-primary border-primary/20"
                      >
                        {t.display_name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </div>
              </td>
              <td className="p-3">
                {cat._count != null ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      {cat._count.local_singles ?? 0}
                    </Badge>
                    <span className="text-muted-foreground text-xs">/ {cat._count.singles}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3">
                <Badge
                  variant={cat.is_active ? 'default' : 'outline'}
                  className={cat.is_active ? 'bg-green-100 text-green-800 border-none' : 'text-muted-foreground'}
                >
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    title={cat.is_active ? 'Desactivar' : 'Activar'}
                    onClick={() => onToggle(cat)}
                  >
                    <ToggleLeft24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(cat)}>
                    <Edit24Regular className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(cat)}
                  >
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
