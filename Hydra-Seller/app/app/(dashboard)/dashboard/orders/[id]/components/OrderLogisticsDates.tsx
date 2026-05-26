'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarLtr24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';

interface OrderLogisticsDatesProps {
  importOrderedAt: string;
  arrivedAt: string;
  estimatedDeliveryAt: string;
  deliveredAt: string;
  isUpdatingDates: boolean;
  hasImportItems: boolean;
  onImportOrderedAtChange: (value: string) => void;
  onArrivedAtChange: (value: string) => void;
  onEstimatedDeliveryAtChange: (value: string) => void;
  onDeliveredAtChange: (value: string) => void;
  onSave: () => void;
}

export function OrderLogisticsDates({
  importOrderedAt,
  arrivedAt,
  estimatedDeliveryAt,
  deliveredAt,
  isUpdatingDates,
  hasImportItems,
  onImportOrderedAtChange,
  onArrivedAtChange,
  onEstimatedDeliveryAtChange,
  onDeliveredAtChange,
  onSave,
}: OrderLogisticsDatesProps) {
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
        {hasImportItems && (
          <div className="space-y-2">
            <label
              htmlFor="importOrderedAt"
              className="text-xs font-bold text-muted-foreground uppercase"
            >
              Pedido a Importation
            </label>
            <input
              id="importOrderedAt"
              type="date"
              className="w-full p-2 border rounded-md text-sm"
              value={importOrderedAt}
              onChange={(e) => onImportOrderedAtChange(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <label
            htmlFor="arrivedAt"
            className="text-xs font-bold text-muted-foreground uppercase"
          >
            Llegada a México
          </label>
          <input
            id="arrivedAt"
            type="date"
            className="w-full p-2 border rounded-md text-sm"
            value={arrivedAt}
            onChange={(e) => onArrivedAtChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="estimatedDeliveryAt"
            className="text-xs font-bold text-muted-foreground uppercase"
          >
            Entrega Aproximada
          </label>
          <input
            id="estimatedDeliveryAt"
            type="date"
            className="w-full p-2 border rounded-md text-sm"
            value={estimatedDeliveryAt}
            onChange={(e) => onEstimatedDeliveryAtChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="deliveredAt"
            className="text-xs font-bold text-muted-foreground uppercase"
          >
            Fecha de Entrega Final
          </label>
          <input
            id="deliveredAt"
            type="date"
            className="w-full p-2 border rounded-md text-sm"
            value={deliveredAt}
            onChange={(e) => onDeliveredAtChange(e.target.value)}
          />
        </div>
        <Button
          className="w-full mt-2"
          size="sm"
          onClick={onSave}
          disabled={isUpdatingDates}
        >
          {isUpdatingDates ? (
            <SpinnerIos20Regular className="size-4 animate-spin mr-2" />
          ) : (
            <CalendarLtr24Regular className="size-4 mr-2" />
          )}
          Guardar Fechas
        </Button>
      </CardContent>
    </Card>
  );
}
