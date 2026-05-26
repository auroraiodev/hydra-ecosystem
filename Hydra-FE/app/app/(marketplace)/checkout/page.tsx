'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  ArrowRight,
  Lock,
  ChevronRight,
} from 'lucide-react';
import type { CartItem } from '@/features/cart/types';
import { FlowButton } from '@/features/shared/ui/flow-button';
import {
  useCheckout,
  ContactSection,
  ShippingMethodSelector,
  AddressSelector,
  OrderSummary,
  ImportWarningModal,
} from '@/features/checkout';
import { FullPageLoader, MobilePageContainer } from '@/features/shared/components';
import { CheckoutSkeleton } from '@/features/shared/components/skeletons';
import { ShippingSection } from '@/features/checkout/components/sections/ShippingSection';
import { PaymentSection } from '@/features/checkout/components/sections/PaymentSection';
import { EmptyCheckoutView } from '@/features/checkout/components/views/EmptyCheckoutView';
import { MobileStepIndicator } from '@/features/checkout/components/MobileStepIndicator';

export default function CheckoutPage() {
  const {
    items,
    isLoading,
    isLoaded,
    paymentMethod,
    setPaymentMethod,
    shippingMethod,
    setShippingMethod,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    isAddingAddress,
    setIsAddingAddress,
    phoneNumber,
    setPhoneNumber,
    balance,
    showImportWarning,
    setShowImportWarning,
    isProcessing,
    backendTotals,
    isFetchingTotals,
    mobileStep,
    setMobileStep,
    newAddress,
    setNewAddress,
    userName,
    totalPrice,
    totalItems,
    shippingCost,
    finalTotal,
    isMpDisabled,
    hasOutOfStockSelected,
    selectedItemIds,
    handleAddAddress,
    handleCheckoutClick,
    handleCheckout,
    handleMobileShippingSelect,
    handleMobileAddressSelect,
    toggleItemSelection,
    toggleAllSelection,
    formatPrice,
  } = useCheckout();

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  if (!mounted.current || isLoading || !isLoaded || isFetchingTotals) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return <EmptyCheckoutView />;
  }

  return (
    <>
      {isProcessing && (
        <FullPageLoader
          variant="overlay"
          label="Procesando tu pedido..."
          className="fixed inset-0 z-[100]"
        />
      )}

      <MobilePageContainer className="dark flex flex-col relative overflow-hidden">
        <MobileStepIndicator
          mobileStep={mobileStep}
          finalTotal={finalTotal}
          formatPrice={formatPrice}
        />

        <div className="flex items-center gap-3 px-4 mt-2">
          <button
            onClick={() => (mobileStep > 1 ? setMobileStep((prev: number) => prev - 1) : null)}
            className="size-10 flex items-center justify-center rounded-xl bg-vault-surface border border-vault-border"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 gap-y-4">
          {mobileStep === 1 && (
            <div className="gap-y-4">
              <ContactSection
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                emailOrUsername={userName || 'Invitado'}
                mobileInlined
              />
              <div className="bg-vault-surface rounded-2xl border border-vault-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-vault-text-muted uppercase">Tu pedido</span>
                  <span className="text-xs font-medium text-teal">{totalItems} items</span>
                </div>
                <div className="gap-y-2">
                  {items.slice(0, 3).map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate flex-1 pr-4">{item.title}</span>
                      <span className="font-medium">
                        {formatPrice(
                          (backendTotals?.items?.find((bi) => bi.id === item.cartItemId)?.unitPrice ||
                            0) * item.quantity
                        )}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-vault-text-muted">+{items.length - 3} más…</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {mobileStep === 2 && (
            <div className="gap-y-4">
              <ShippingMethodSelector
                shippingMethod={shippingMethod}
                setShippingMethod={handleMobileShippingSelect}
              />
              {shippingMethod === 'shipping' && (
                <AddressSelector
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  setSelectedAddressId={handleMobileAddressSelect}
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
          )}
          {mobileStep === 3 && (
            <PaymentSection
              flags={{ hideCta: false, isMpDisabled, hasOutOfStockSelected, isProcessing }}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              balance={balance}
              finalTotal={finalTotal}
              formatPrice={formatPrice}
              handleCheckoutClick={handleCheckoutClick}
              selectedAddressId={selectedAddressId}
              shippingMethod={shippingMethod}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-vault-bg/95 backdrop-blur-xl border-t border-vault-border p-4 pb-safe">
          <FlowButton
            onClick={() =>
              mobileStep < 3 ? setMobileStep((prev: number) => prev + 1) : handleCheckoutClick()
            }
            disabled={
              isProcessing ||
              (mobileStep === 2 && shippingMethod === 'shipping' && !selectedAddressId)
            }
            className="w-full bg-teal text-white rounded-xl h-12 font-bold shadow-lg shadow-teal/20"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando…
              </span>
            ) : mobileStep < 3 ? (
              <span className="flex items-center gap-2 justify-center">
                Continuar
                <ArrowRight className="size-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <Lock className="size-4" />
                Pagar {formatPrice(finalTotal)}
              </span>
            )}
          </FlowButton>
        </div>
      </MobilePageContainer>

      <div className="dark hidden lg:block bg-vault-bg text-vault-text min-h-screen relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/cart" className="text-vault-text-muted hover:text-teal transition-colors">
              Carrito
            </Link>
            <ChevronRight className="size-4 text-vault-text-muted/50" />
            <span className="font-medium">Checkout</span>
          </nav>

          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-8 gap-y-6">
              <div className="bg-vault-surface rounded-2xl border border-vault-border p-6">
                <ContactSection
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  emailOrUsername={userName || 'Invitado'}
                />
              </div>
              <ShippingSection
                shippingMethod={shippingMethod}
                setShippingMethod={setShippingMethod}
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                isAddingAddress={isAddingAddress}
                setIsAddingAddress={setIsAddingAddress}
                newAddress={newAddress}
                setNewAddress={setNewAddress}
                handleAddAddress={handleAddAddress}
                userName={userName}
                shippingCost={shippingCost}
                formatPrice={formatPrice}
              />
              <PaymentSection
                flags={{ hideCta: true, isAddingAddress, isMpDisabled, hasOutOfStockSelected, isProcessing }}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                balance={balance}
                finalTotal={finalTotal}
                formatPrice={formatPrice}
                handleCheckoutClick={handleCheckoutClick}
                selectedAddressId={selectedAddressId}
                shippingMethod={shippingMethod}
              />
            </div>

            <div className="col-span-4">
              <OrderSummary
                items={items.map((item: CartItem) => ({
                  ...item,
                  id: item.cartItemId || item.id,
                  price:
                    backendTotals?.items?.find((bi) => bi.id === item.cartItemId)?.unitPrice || 0,
                  outOfStock:
                    backendTotals?.items?.find((bi) => bi.id === item.cartItemId)?.outOfStock ??
                    false,
                }))}
                totalItems={totalItems}
                totalPrice={totalPrice}
                shippingMethod={shippingMethod}
                shippingCost={shippingCost}
                finalTotal={finalTotal}
                formatPrice={formatPrice}
                selectedItemIds={selectedItemIds}
                onToggleItem={toggleItemSelection}
                onToggleAll={toggleAllSelection}
              />

              <div className="mt-6">
                <FlowButton
                  onClick={handleCheckoutClick}
                  disabled={
                    isProcessing ||
                    (shippingMethod === 'shipping' && !selectedAddressId) ||
                    hasOutOfStockSelected
                  }
                  className="w-full bg-teal text-white rounded-xl h-14 text-lg font-bold shadow-xl shadow-teal/20"
                >
                  {isProcessing ? (
                    'Procesando...'
                  ) : (
                    <>Confirmar y pagar {formatPrice(finalTotal)}</>
                  )}
                </FlowButton>
                <p className="text-center text-xs text-vault-text-muted mt-4 flex items-center justify-center gap-2">
                  <ShieldCheck className="size-4" /> Transacción 100% seguro
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportWarningModal
        open={showImportWarning}
        onCancel={() => setShowImportWarning(false)}
        onConfirm={() => {
          setShowImportWarning(false);
          handleCheckout();
        }}
      />
    </>
  );
}
