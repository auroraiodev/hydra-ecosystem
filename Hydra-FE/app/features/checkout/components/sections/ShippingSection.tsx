'use client';

import React from 'react';
import { ShippingMethodSelector } from '../ShippingMethodSelector';
import { AddressSelector } from '../AddressSelector';
import type { Address } from '@/lib/api/users';
import type { ShippingMethod } from '@/features/checkout/types';

interface ShippingSectionProps {
  shippingMethod: ShippingMethod;
  setShippingMethod: (method: ShippingMethod) => void;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  isAddingAddress: boolean;
  setIsAddingAddress: (val: boolean) => void;
  newAddress: Partial<Address>;
  setNewAddress: (
    address: Partial<Address> | ((prev: Partial<Address>) => Partial<Address>)
  ) => void;
  handleAddAddress: () => Promise<void>;
  userName: string | null;
  shippingCost?: number;
  formatPrice?: (price: number) => React.ReactNode;
}

export function ShippingSection({
  shippingMethod,
  setShippingMethod,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  isAddingAddress,
  setIsAddingAddress,
  newAddress,
  setNewAddress,
  handleAddAddress,
  userName,
}: ShippingSectionProps) {
  return (
    <div className="bg-vault-surface rounded-2xl border border-vault-border p-6 space-y-6">
      <ShippingMethodSelector
        shippingMethod={shippingMethod}
        setShippingMethod={setShippingMethod}
      />
      {shippingMethod === 'shipping' && (
        <AddressSelector
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={setSelectedAddressId}
          isLoadingAddresses={false}
          isAddingAddress={isAddingAddress}
          setIsAddingAddress={setIsAddingAddress}
          newAddress={newAddress}
          setNewAddress={setNewAddress}
          handleAddAddress={handleAddAddress}
          userName={userName}
        />
      )}
    </div>
  );
}

