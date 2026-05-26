import React from 'react';
import { Button } from '@/components/ui/button';
import { Warning24Regular, Open24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';
import { toast } from 'sonner';

interface PaymentBalance {
  paidAmount: number;
  currentTotal: number;
  difference: number;
  paymentMethod: string;
  orderStatus: string;
  needsSupplementalPayment: boolean;
}

interface PaymentBalanceAlertProps {
  balance: PaymentBalance | null;
  initPoint: string | null;
  reopening: boolean;
  onReopen: () => void;
}

export function PaymentBalanceAlert({
  balance,
  initPoint,
  reopening,
  onReopen,
}: PaymentBalanceAlertProps) {
  if (balance?.needsSupplementalPayment && !initPoint) {
    return (
      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Warning24Regular className="size-5 text-amber-600 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-800">Saldo pendiente detectado</p>
          <p className="text-amber-700">
            El cliente pagó <strong>${balance.paidAmount.toFixed(2)} MXN</strong> pero el total
            actual es <strong>${balance.currentTotal.toFixed(2)} MXN</strong>. Diferencia:{' '}
            <strong>${balance.difference.toFixed(2)} MXN</strong>.
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          onClick={onReopen}
          disabled={reopening}
        >
          {reopening ? <SpinnerIos20Regular className="size-4 animate-spin mr-2" /> : null}
          Reabrir y cobrar diferencia
        </Button>
      </div>
    );
  }

  if (initPoint) {
    return (
      <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Open24Regular className="size-5 text-blue-600 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-blue-800">
            Orden reabierta: comparte este enlace con el cliente
          </p>
          <a
            href={initPoint}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all text-xs"
          >
            {initPoint}
          </a>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(initPoint);
            toast.success('Enlace copiado');
          }}
        >
          Copiar
        </Button>
      </div>
    );
  }

  return null;
}
