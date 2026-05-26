'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular,
} from '@fluentui/react-icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading: boolean;
}

export function ProductsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  isLoading,
}: ProductsPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pb-20 lg:pb-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Mostrar
          </span>
          <Select
            value={limit.toString()}
            onValueChange={(val) => onLimitChange(parseInt(val))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[80px] h-9 bg-background/50 border-primary/10">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-4 w-px bg-primary/10" />
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          {total} resultados totales
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl border-primary/5 hover:bg-primary/5"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || isLoading}
        >
          <ChevronDoubleLeftRegular className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl border-primary/5 hover:bg-primary/5"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
        >
          <ChevronLeft24Regular className="size-4" />
        </Button>

        <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-primary/[0.03] border border-primary/5 min-w-[100px] justify-center">
          <span className="text-xs font-bold text-primary">{page}</span>
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            de {totalPages || 1}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl border-primary/5 hover:bg-primary/5"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          <ChevronRight24Regular className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl border-primary/5 hover:bg-primary/5"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || isLoading}
        >
          <ChevronDoubleRightRegular className="size-4" />
        </Button>
      </div>
    </div>
  );
}
