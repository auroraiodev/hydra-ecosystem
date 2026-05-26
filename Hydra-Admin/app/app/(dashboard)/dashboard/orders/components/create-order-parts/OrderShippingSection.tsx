import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserAddressItem {
  id: string;
  street: string;
  city: string;
  zip_code: string;
}

interface OrderShippingSectionProps {
  shippingMethod: string;
  onShippingMethodChange: (val: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  addressId: string;
  onAddressIdChange: (val: string) => void;
  userAddresses: UserAddressItem[];
}

export function OrderShippingSection({
  shippingMethod,
  onShippingMethodChange,
  paymentMethod,
  onPaymentMethodChange,
  addressId,
  onAddressIdChange,
  userAddresses,
}: OrderShippingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Shipping Method</Label>
          <Select value={shippingMethod} onValueChange={onShippingMethodChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shipping">Ship to Address</SelectItem>
              <SelectItem value="arrange">Arrange with Seller</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {shippingMethod === 'shipping' && (
        <div className="space-y-2">
          <Label>Shipping Address</Label>
          {userAddresses.length === 0 ? (
            <div className="text-sm text-yellow-600 border border-yellow-200 bg-yellow-50 p-2 rounded">
              User has no saved addresses.
            </div>
          ) : (
            <Select value={addressId} onValueChange={onAddressIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select address" />
              </SelectTrigger>
              <SelectContent>
                {userAddresses.map((addr) => (
                  <SelectItem key={addr.id} value={addr.id}>
                    {addr.street}, {addr.city} ({addr.zip_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
