'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ImageShadow24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';

interface PendingPayoutItem {
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
}

interface PendingPayout {
  orderId: string;
  subtotal: number;
  items: PendingPayoutItem[];
}

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: PendingPayout[];
  selectedTotal: number;
  payoutDetails: string;
  onPayoutDetailsChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function PayoutRequestDialog({
  open,
  onOpenChange,
  selectedOrders,
  selectedTotal,
  payoutDetails,
  onPayoutDetailsChange,
  isSubmitting,
  onSubmit,
}: PayoutRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Cobro de Órdenes</DialogTitle>
          <CardDescription>
            Confirma las órdenes seleccionadas y proporciona tus datos bancarios.
          </CardDescription>
        </DialogHeader>

        <div className="rounded-lg border border-zinc-100 overflow-hidden mt-2">
          <div className="bg-zinc-50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Órdenes a cobrar ({selectedOrders.length})
            </span>
            <span className="text-sm font-bold text-zinc-800 tabular-nums">
              {fmtMXN(selectedTotal)}
            </span>
          </div>
          <div className="divide-y divide-zinc-50 max-h-52 overflow-y-auto">
            {selectedOrders.map((p) => (
              <div key={p.orderId} className="flex items-start gap-3 px-4 py-2.5">
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {p.items.slice(0, 3).map((item) => (
                    <div
                      key={`${p.orderId}-thumb-${item.name}`}
                      className="relative size-8 shrink-0 rounded overflow-hidden border border-zinc-100"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain bg-zinc-50"
                        />
                      ) : (
                        <div className="size-full bg-zinc-100 flex items-center justify-center">
                          <ImageShadow24Regular className="size-3.5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {p.items.length > 3 && (
                    <div className="size-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-100 text-[10px] font-bold text-zinc-500">
                      +{p.items.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-700">
                    #{p.orderId.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {p.items.map((i) => i.name).join(', ')}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 shrink-0 tabular-nums">
                  {fmtMXN(p.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-zinc-400 text-sm font-medium">Total a cobrar</span>
          <span className="text-white text-xl font-bold tabular-nums">
            {fmtMXN(selectedTotal)}
          </span>
        </div>

        <div className="space-y-2">
          <label htmlFor="payout-details" className="text-sm font-medium text-zinc-700">
            Datos bancarios para transferencia
          </label>
          <Textarea
            id="payout-details"
            placeholder="Indica Banco, CLABE (18 dígitos) y Nombre del Titular…"
            value={payoutDetails}
            onChange={(e) => onPayoutDetailsChange(e.target.value)}
            className="resize-none h-24"
          />
          <p className="text-[10px] text-muted-foreground italic">* Sin comisiones por cobro.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !payoutDetails.trim()}
            className="bg-zinc-900 text-white hover:bg-zinc-800 px-8"
          >
            {isSubmitting ? (
              <>
                <Clock24Regular className="mr-2 size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              'Confirmar Solicitud'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
