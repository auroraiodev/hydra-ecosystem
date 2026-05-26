'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard24Regular, Add24Regular, Delete24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';

type TrackingEntry = { date: string; time: string; origin: string; event: string };

interface OrderInternalLogCardProps {
  internalOrderNumber: string;
  trackingEntries: TrackingEntry[];
  newEntry: TrackingEntry;
  isUpdatingInternal: boolean;
  onFieldChange: (field: string, value: string) => void;
  onNewEntryChange: (entry: TrackingEntry) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onSaveInternal: () => void;
}

export function OrderInternalLogCard({
  internalOrderNumber,
  trackingEntries,
  newEntry,
  isUpdatingInternal,
  onFieldChange,
  onNewEntryChange,
  onAddEntry,
  onRemoveEntry,
  onSaveInternal,
}: OrderInternalLogCardProps) {
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
        <div className="space-y-1.5">
          <label
            htmlFor="internal-order-number"
            className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
          >
            ID de Orden Interno
          </label>
          <input
            id="internal-order-number"
            type="text"
            className="w-full p-2.5 bg-background border border-border/60 rounded-xl text-sm font-bold placeholder:font-normal"
            placeholder="Ej. HR-2024-00123"
            value={internalOrderNumber}
            onChange={(e) => onFieldChange('internalOrderNumber', e.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-dashed border-border/80 p-4 bg-muted/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Nueva Bitácora
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="entry-date"
                className="text-[9px] font-bold uppercase text-muted-foreground/50"
              >
                Fecha
              </label>
              <input
                id="entry-date"
                type="text"
                className="w-full p-2 border border-border/60 rounded-lg text-xs tabular-nums"
                placeholder="DD/MM/YYYY"
                value={newEntry.date}
                onChange={(e) => onNewEntryChange({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="entry-time"
                className="text-[9px] font-bold uppercase text-muted-foreground/50"
              >
                Hora
              </label>
              <input
                id="entry-time"
                type="text"
                className="w-full p-2 border border-border/60 rounded-lg text-xs tabular-nums"
                placeholder="HH:MM:SS"
                value={newEntry.time}
                onChange={(e) => onNewEntryChange({ ...newEntry, time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="entry-event"
              className="text-[9px] font-bold uppercase text-muted-foreground/50"
            >
              Evento / Ubicación
            </label>
            <input
              id="entry-event"
              type="text"
              className="w-full p-2 border border-border/60 rounded-lg text-xs"
              placeholder="Ej. Depósito en Japón"
              value={newEntry.event}
              onChange={(e) => onNewEntryChange({ ...newEntry, event: e.target.value })}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5"
            onClick={onAddEntry}
          >
            <Add24Regular className="size-3 mr-1" />
            Añadir a Bitácora
          </Button>
        </div>

        {trackingEntries.length > 0 && (
          <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
            <div className="max-h-[200px] overflow-y-auto no-scrollbar">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-muted/50 sticky top-0 border-b border-border/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-[9px] font-black uppercase text-muted-foreground/60">
                      Info
                    </th>
                    <th className="text-left px-3 py-2 text-[9px] font-black uppercase text-muted-foreground/60">
                      Evento
                    </th>
                    <th className="px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {trackingEntries.map((entry, i) => (
                    <tr
                      key={`${entry.date}-${entry.time}-${entry.event}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2 leading-tight">
                        <div className="font-bold tabular-nums text-[10px]">{entry.date}</div>
                        <div className="text-[9px] text-muted-foreground/70 tabular-nums">
                          {entry.time}
                        </div>
                      </td>
                      <td className="px-3 py-2 leading-tight">
                        <div className="font-medium text-[10px]">
                          {entry.event}
                        </div>
                        {entry.origin && (
                          <div className="text-[9px] text-muted-foreground/60">
                            {entry.origin}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => onRemoveEntry(i)}
                          className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all"
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

        <Button
          className="w-full font-black rounded-xl"
          size="sm"
          onClick={onSaveInternal}
          disabled={isUpdatingInternal}
        >
          {isUpdatingInternal ? (
            <SpinnerIos20Regular className="size-4 animate-spin mr-2" />
          ) : (
            <Clipboard24Regular className="size-4 mr-2" />
          )}
          GUARDAR BITÁCORA
        </Button>
      </CardContent>
    </Card>
  );
}
