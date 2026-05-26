import { Suspense } from 'react';
import { OrdersContent } from './orders-content';
import OrdersLoading from './loading';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  );
}
