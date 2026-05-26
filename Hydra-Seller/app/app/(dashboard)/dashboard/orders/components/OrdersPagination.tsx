'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft24Regular, ChevronRight24Regular } from '@fluentui/react-icons';

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function OrdersPagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: OrdersPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Mostrar</span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
          }}
          className="h-8 w-16 border border-zinc-200 dark:border-zinc-800 bg-background rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          {[10, 20, 50, 100].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <span>por página</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <span className="sr-only">Primera página</span>
          <span className="text-xs">«</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft24Regular className="size-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2 text-sm font-medium">
          <span>Página {page} de {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight24Regular className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
        >
          <span className="sr-only">Última página</span>
          <span className="text-xs">»</span>
        </Button>
      </div>
    </div>
  );
}
