import { CreditCard, Wallet, MapPin, Truck } from 'lucide-react';
import { PAYMENT_STATUS_MAP } from '../constants';
import type { OrderInfoCardsProps } from '../types';
import { CopyField } from './CopyField';

export function OrderInfoCards({ order }: OrderInfoCardsProps) {
  return (
    <div className="flex flex-col gap-y-5">
      {/* Shipping Info */}
      {order.shipping && (
        <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
          <div className="p-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-body">Envío</h2>
                <p className="text-xs text-text-muted">Dirección y método de entrega</p>
              </div>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-y-4">
            <div className="bg-surface-low p-4 rounded-xl border border-border-subtle">
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-text-body">
                    {order.shipping.address.receiverName || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{order.shipping.address.street}</p>
                  <p className="text-xs text-text-muted">
                    {order.shipping.address.city}, {order.shipping.address.state}{' '}
                    {order.shipping.address.zipCode}
                  </p>
                  <p className="text-xs text-text-muted uppercase tracking-wide mt-1">
                    {order.shipping.address.country}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-text-muted">Método de envío</span>
              <span className="text-sm font-bold text-text-body">
                {order.shipping.shippingMethod}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {order.payment && (
        <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
          <div className="p-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-body">Pago</h2>
                <p className="text-xs text-text-muted">Método y estado del pago</p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <span className="text-xs font-medium text-text-muted">Método</span>
              <div className="flex items-center gap-2 text-sm font-bold text-text-body">
                {order.payment.paymentMethod === 'mercadopago' ? (
                  <CreditCard className="size-4 text-primary" />
                ) : (
                  <Wallet className="size-4 text-primary" />
                )}
                {order.payment.paymentMethod === 'mercadopago'
                  ? 'Mercado Pago'
                  : order.payment.paymentMethod === 'wallet'
                    ? 'Hydra Wallet'
                    : 'Transferencia'}
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <span className="text-xs font-medium text-text-muted">Estado</span>
              <span className="text-sm font-bold text-text-body">
                {PAYMENT_STATUS_MAP[order.payment.status] || order.payment.status}
              </span>
            </div>

            {order.payment.mercadopagoPaymentId && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-muted">ID de pago</span>
                <span className="text-xs font-mono text-text-muted truncate bg-surface-low px-3 py-2 rounded-lg border border-border-subtle">
                  {order.payment.mercadopagoPaymentId}
                </span>
              </div>
            )}

            {/* Bank Transfer Details */}
            {order.payment.paymentMethod === 'transfer' && (
              <div className="mt-4 bg-primary/5 rounded-xl p-5 border border-primary/20">
                <h4 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                  <Wallet className="size-4" /> Datos de Transferencia
                </h4>
                <div className="flex flex-col gap-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-primary/10">
                    <span className="text-text-muted font-medium">Banco</span>
                    <span className="font-bold text-text-body">Santander</span>
                  </div>
                  <div className="py-1.5 border-b border-primary/10">
                    <span className="text-text-muted font-medium text-xs block mb-1">CLABE</span>
                    <CopyField value="014090606265967498" label="CLABE" mono />
                  </div>
                  <div className="py-1.5 border-b border-primary/10">
                    <span className="text-text-muted font-medium text-xs block mb-1">
                      Beneficiario
                    </span>
                    <CopyField value="Demis Alberto Rincon Martinez" label="Beneficiario" />
                  </div>
                  <div className="py-1.5 border-b border-primary/10">
                    <span className="text-text-muted font-medium text-xs block mb-1">
                      Concepto
                    </span>
                    <CopyField
                      value={`Pago Hydra #${order.id.replace(/\D/g, '').slice(0, 8)}`}
                      label="Concepto"
                      mono
                    />
                  </div>
                  <div className="py-1.5 border-b border-primary/10">
                    <span className="text-text-muted font-medium text-xs block mb-1">
                      Referencia
                    </span>
                    <CopyField
                      value={order.id.replace(/\D/g, '').slice(0, 8)}
                      label="Referencia"
                      mono
                    />
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg mt-3 text-xs text-primary font-medium leading-relaxed">
                    Importante: Usa la referencia al transferir. Tu orden se procesará tras
                    confirmar los fondos.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
