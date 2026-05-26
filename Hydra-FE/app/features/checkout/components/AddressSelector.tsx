'use client';

import { PlusCircle, ArrowRight, Check, MapPin } from 'lucide-react';
import { Input } from '@/features/shared/ui/Input';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { Skeleton } from '@/features/shared/ui/skeleton';
import type { Address } from '@/lib/api/users';
import { type AddressSelectorProps } from '../types';

export function AddressSelector({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  isLoadingAddresses,
  isAddingAddress,
  setIsAddingAddress,
  newAddress,
  setNewAddress,
  handleAddAddress,
  userName,
}: AddressSelectorProps) {
  return (
    <div className="p-5">
      {isLoadingAddresses ? (
        <div className="gap-y-3">
          {[1, 2].map((num) => (
            <div
              key={`address-skeleton-${num}`}
              className="p-4 rounded-xl border border-border-subtle bg-surface-low/50"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="size-5 rounded-full mt-0.5" />
                <div className="flex-1 gap-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isAddingAddress ? (
        <div className="gap-y-3">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => setSelectedAddressId(addr.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'border-teal bg-teal/5 shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.1)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div
                  className={`mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'border-teal bg-teal' : 'border-white/20'
                  }`}
                >
                  {isSelected && <Check className="size-3 text-black" />}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-black text-text-body uppercase tracking-tight">
                    {addr.receiver_name || userName || 'Usuario'}
                  </p>
                  <p className="text-sm font-medium text-text-muted mt-1 truncate">{addr.street}</p>
                  <p className="text-[11px] font-bold text-text-muted/70 uppercase tracking-wider">
                    {addr.city}, {addr.state} {addr.zip_code}
                  </p>
                </div>
                {isSelected && (
                  <div className="shrink-0 relative z-10">
                    <MapPin className="size-4 text-teal animate-glow-pulse" />
                  </div>
                )}
              </button>
            );
          })}

          <FlowButton
            onClick={() => setIsAddingAddress(true)}
            variant="outline"
            size="md"
            className="w-full border-2 border-dashed rounded-xl h-12"
          >
            <span className="flex items-center gap-2 text-sm">
              <PlusCircle className="size-4" />
              Agregar nueva dirección
            </span>
          </FlowButton>
        </div>
      ) : (
        <div className="gap-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-text-body">Nueva Dirección</h3>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="text-xs font-medium text-text-muted hover:text-red-500 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="gap-y-3">
            <Input
              label="Nombre de quien recibe"
              value={newAddress.receiver_name || ''}
              onChange={(e) =>
                setNewAddress((prev: Partial<Address>) => ({
                  ...prev,
                  receiver_name: e.target.value,
                }))
              }
              placeholder="Nombre completo"
            />
            <Input
              label="Calle y Número / Depto"
              value={newAddress.street || ''}
              onChange={(e) =>
                setNewAddress((prev: Partial<Address>) => ({
                  ...prev,
                  street: e.target.value,
                }))
              }
              placeholder="Ej: Av. Reforma 222, Depto 401"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ciudad"
                value={newAddress.city || ''}
                onChange={(e) =>
                  setNewAddress((prev: Partial<Address>) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
              />
              <Input
                label="Estado"
                value={newAddress.state || ''}
                onChange={(e) =>
                  setNewAddress((prev: Partial<Address>) => ({
                    ...prev,
                    state: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Código Postal"
                value={newAddress.zip_code || ''}
                onChange={(e) =>
                  setNewAddress((prev: Partial<Address>) => ({
                    ...prev,
                    zip_code: e.target.value,
                  }))
                }
              />
              <Input
                label="País"
                value="México"
                readOnly
                disabled
                className="bg-surface-low text-text-muted"
              />
            </div>
            <FlowButton
              onClick={handleAddAddress}
              variant="default"
              size="md"
              className="w-full rounded-xl h-11"
            >
              <span className="flex items-center gap-2 text-sm">
                Guardar Dirección
                <ArrowRight className="size-4" />
              </span>
            </FlowButton>
          </div>
        </div>
      )}
    </div>
  );
}
