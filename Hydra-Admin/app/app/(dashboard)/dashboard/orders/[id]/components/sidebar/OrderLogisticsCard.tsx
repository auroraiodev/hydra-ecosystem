'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarLtr24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';
import type { Order } from '@/lib/types';

interface OrderLogisticsCardProps {
  order: Order;
  importOrderedAt: string;
  arrivedAt: string;
  estimatedDeliveryAt: string;
  isUpdatingDates: boolean;
  onFieldChange: (field: string, value: string) => void;
  onUpdateDates: () => void;
}

export function OrderLogisticsCard({
  order,
  importOrderedAt,
  arrivedAt,
  estimatedDeliveryAt,
  isUpdatingDates,
  onFieldChange,
  onUpdateDates,
}: OrderLogisticsCardProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <CalendarLtr24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Fechas de Logística
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        {order.items.some((i) => !i.isLocalInventory) && (
          <div className="space-y-1.5">
            <label
              htmlFor="import-ordered-at"
              className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
            >
              Pedido a Importation
            </label>
            <input
              id="import-ordered-at"
              type="date"
              className="w-full p-2 bg-background border border-border/60 rounded-xl text-sm font-medium tabular-nums cursor-pointer"
              value={importOrderedAt}
              onChange={(e) => onFieldChange('importOrderedAt', e.target.value)}
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="arrived-at"
              className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
            >
              Llegada a México
            </label>
            <input
              id="arrived-at"
              type="date"
              className="w-full p-2 bg-background border border-border/60 rounded-xl text-sm font-medium tabular-nums cursor-pointer"
              value={arrivedAt}
              onChange={(e) => onFieldChange('arrivedAt', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="estimated-delivery-at"
              className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
            >
              Entrega Aproximada
            </label>
            <input
              id="estimated-delivery-at"
              type="date"
              className="w-full p-2 bg-background border border-border/60 rounded-xl text-sm font-medium tabular-nums cursor-pointer"
              value={estimatedDeliveryAt}
              onChange={(e) => onFieldChange('estimatedDeliveryAt', e.target.value)}
            />
          </div>
        </div>
        <Button
          className="w-full mt-2 font-bold rounded-xl"
          size="sm"
          onClick={onUpdateDates}
          disabled={isUpdatingDates}
        >
          {isUpdatingDates ? (
            <SpinnerIos20Regular className="size-4 animate-spin mr-2" />
          ) : (
            <CalendarLtr24Regular className="size-4 mr-2" />
          )}
          Actualizar Fechas
        </Button>
      </CardContent>
    </Card>
  );
}
