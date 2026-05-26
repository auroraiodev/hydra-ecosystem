'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SpinnerIos20Regular,
  Clipboard24Regular,
  Add24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';

type TrackingEntry = { date: string; time: string; origin: string; event: string };

interface OrderTrackingSectionProps {
  internalOrderNumber: string;
  trackingEntries: TrackingEntry[];
  newEntry: TrackingEntry;
  isUpdatingInternal: boolean;
  onInternalOrderNumberChange: (value: string) => void;
  onNewEntryChange: (entry: TrackingEntry) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onSave: () => void;
}

export function OrderTrackingSection({
  internalOrderNumber,
  trackingEntries,
  newEntry,
  isUpdatingInternal,
  onInternalOrderNumberChange,
  onNewEntryChange,
  onAddEntry,
  onRemoveEntry,
  onSave,
}: OrderTrackingSectionProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <Clipboard24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Seguimiento Interno
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="internalOrderNumber"
            className="text-xs font-bold text-muted-foreground uppercase"
          >
            Número de Orden Interno
          </label>
          <input
            id="internalOrderNumber"
            type="text"
            className="w-full p-2 border rounded-md text-sm"
            placeholder="Ej. HR-2024-00123"
            value={internalOrderNumber}
            onChange={(e) => onInternalOrderNumberChange(e.target.value)}
          />
        </div>

        {trackingEntries.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Datos de Seguimiento
            </span>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-semibold">Fecha</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Hora</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Origen</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Evento</th>
                    <th className="px-1 py-1.5" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {trackingEntries.map((entry, i) => (
                    <tr key={`${entry.date}-${entry.time}-${entry.event}`} className="border-t">
                      <td className="px-2 py-1.5 whitespace-nowrap font-medium">{entry.date}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">
                        {entry.time}
                      </td>
                      <td className="px-2 py-1.5">{entry.origin}</td>
                      <td className="px-2 py-1.5">{entry.event}</td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => onRemoveEntry(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove entry"
                        >
                          <Delete24Regular className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-bold text-muted-foreground uppercase">Nueva Entrada</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="newEntryDate" className="text-xs text-muted-foreground">
                Fecha
              </label>
              <input
                id="newEntryDate"
                type="text"
                className="w-full p-1.5 border rounded text-xs"
                placeholder="13/03/2026"
                value={newEntry.date}
                onChange={(e) => onNewEntryChange({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="newEntryTime" className="text-xs text-muted-foreground">
                Hora
              </label>
              <input
                id="newEntryTime"
                type="text"
                className="w-full p-1.5 border rounded text-xs"
                placeholder="18:14:00"
                value={newEntry.time}
                onChange={(e) => onNewEntryChange({ ...newEntry, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="newEntryOrigin" className="text-xs text-muted-foreground">
              Origen
            </label>
            <input
              id="newEntryOrigin"
              type="text"
              className="w-full p-1.5 border rounded text-xs"
              placeholder="Ej. JP, Oficina de Cambio México"
              value={newEntry.origin}
              onChange={(e) => onNewEntryChange({ ...newEntry, origin: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="newEntryEvent" className="text-xs text-muted-foreground">
              Evento
            </label>
            <input
              id="newEntryEvent"
              type="text"
              className="w-full p-1.5 border rounded text-xs"
              placeholder="Ej. Deposito del Cliente en Japan"
              value={newEntry.event}
              onChange={(e) => onNewEntryChange({ ...newEntry, event: e.target.value })}
            />
          </div>
          <Button variant="outline" size="sm" className="w-full mt-1" onClick={onAddEntry}>
            <Add24Regular className="size-3 mr-1" />
            Agregar Entrada
          </Button>
        </div>

        <Button className="w-full" size="sm" onClick={onSave} disabled={isUpdatingInternal}>
          {isUpdatingInternal ? (
            <SpinnerIos20Regular className="size-4 animate-spin mr-2" />
          ) : (
            <Clipboard24Regular className="size-4 mr-2" />
          )}
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}
