'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkle24Regular,
  SpinnerIos20Regular,
  CheckmarkCircle24Regular,
  ArrowUndo24Regular,
} from '@fluentui/react-icons';
import type { Order } from '@/lib/types';

interface OrderStatusCardProps {
  order: Order;
  editStatus: string;
  isRequestingReview: boolean;
  isMarkingPaidLocal: boolean;
  isUndoing: boolean;
  statusColors: Record<string, string>;
  onUpdateStatus: (status: string) => void;
  onRequestReview: () => void;
  onMarkPaidLocal: () => void;
  onUndoToCart: () => void;
}

export function OrderStatusCard({
  order,
  editStatus,
  isRequestingReview,
  isMarkingPaidLocal,
  isUndoing,
  statusColors,
  onUpdateStatus,
  onRequestReview,
  onMarkPaidLocal,
  onUndoToCart,
}: OrderStatusCardProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <Sparkle24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Estado y Acciones
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <div className="grid gap-2">
          <label
            htmlFor="edit-status"
            className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
          >
            Cambiar Estado General
          </label>
          <select
            id="edit-status"
            className="w-full p-2.5 bg-background border border-border/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            value={editStatus}
            onChange={(e) => onUpdateStatus(e.target.value)}
          >
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2">
          {order.status === 'delivered' && !order.reviewRequested && (
            <Button
              variant="outline"
              className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold rounded-xl"
              onClick={onRequestReview}
              disabled={isRequestingReview}
            >
              {isRequestingReview ? (
                <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
              ) : (
                <Sparkle24Regular className="size-4 mr-2" />
              )}
              Pedir Reseña
            </Button>
          )}

          {order.reviewRequested && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-bold">
              <CheckmarkCircle24Regular className="size-4" />
              Reseña Solicitada
            </div>
          )}

          {order.paymentStatus !== 'approved' && (
            <Button
              variant="outline"
              className="w-full bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl"
              onClick={onMarkPaidLocal}
              disabled={isMarkingPaidLocal}
            >
              {isMarkingPaidLocal ? (
                <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
              ) : (
                <CheckmarkCircle24Regular className="size-4 mr-2" />
              )}
              Confirmar Pago (Local)
            </Button>
          )}

          {(order.paymentMethod !== 'mercadopago' ||
            order.status === 'pending' ||
            order.status === 'cancelled') && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold rounded-xl text-xs"
              onClick={onUndoToCart}
              disabled={isUndoing}
            >
              {isUndoing ? (
                <SpinnerIos20Regular className="size-3 mr-2 animate-spin" />
              ) : (
                <ArrowUndo24Regular className="size-3 mr-2" />
              )}
              Reabrir al Carrito
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
