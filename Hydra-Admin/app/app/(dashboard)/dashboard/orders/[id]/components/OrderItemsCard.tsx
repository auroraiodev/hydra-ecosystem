import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box24Regular, Add24Regular } from '@fluentui/react-icons';
import type { Order } from '@/lib/types';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';
import { PaymentBalanceAlert } from './order-items-card-parts/PaymentBalanceAlert';
import { OrderItemsTable } from './order-items-card-parts/OrderItemsTable';

interface PaymentBalance {
  paidAmount: number;
  currentTotal: number;
  difference: number;
  paymentMethod: string;
  orderStatus: string;
  needsSupplementalPayment: boolean;
}

export function OrderItemsCard({
  order,
  onOpenAddItem,
  onRefresh,
}: {
  order: Order;
  onOpenAddItem: () => void;
  onRefresh: () => void;
}) {
  const [balance, setBalance] = React.useState<PaymentBalance | null>(null);
  const [reopening, setReopening] = React.useState(false);
  const [initPoint, setInitPoint] = React.useState<string | null>(null);

  const checkBalance = React.useCallback(async () => {
    const isPaidStatus = ['paid', 'processing', 'shipped', 'completed'].includes(
      order.status.toLowerCase()
    );
    const isMercadoPago = order.paymentMethod?.toLowerCase() === 'mercadopago';
    if (!isPaidStatus || !isMercadoPago) return;

    try {
      const res = await ordersAPI.getPaymentBalance(order.id);
      const data =
        (res as { data?: PaymentBalance } & PaymentBalance).data ?? (res as PaymentBalance);
      setBalance(data);
    } catch {
      // silently ignore
    }
  }, [order.id, order.status, order.paymentMethod]);

  React.useEffect(() => {
    void checkBalance();
  }, [checkBalance]);

  const handleRefreshWithBalance = React.useCallback(async () => {
    onRefresh();
    await checkBalance();
  }, [onRefresh, checkBalance]);

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await ordersAPI.reopenForPayment(order.id);
      const data =
        (
          res as { data?: { initPoint: string; difference: number } } & {
            initPoint: string;
            difference: number;
          }
        ).data ?? (res as { initPoint: string; difference: number });
      setInitPoint(data.initPoint);
      setBalance(null);
      toast.success(`Orden reabierta. Saldo pendiente: $${data.difference.toFixed(2)} MXN`);
      onRefresh();
    } catch {
      toast.error('Error al reabrir la orden');
    } finally {
      setReopening(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-6 border-b border-primary/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Box24Regular className="size-5 text-primary" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Artículos del Pedido
          </h2>
        </div>
        <Button
          onClick={onOpenAddItem}
          size="sm"
          className="h-10 px-6 rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-playful hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Add24Regular className="mr-2 size-4" />
          Agregar Artículo
        </Button>
      </div>
      <CardContent className="p-0">
        <div className="p-4 empty:hidden">
          <PaymentBalanceAlert
            balance={balance}
            initPoint={initPoint}
            reopening={reopening}
            onReopen={handleReopen}
          />
        </div>

        <OrderItemsTable
          order={order}
          onRefresh={onRefresh}
          onRefreshWithBalance={handleRefreshWithBalance}
        />
      </CardContent>
    </Card>
  );
}
