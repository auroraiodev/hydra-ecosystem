'use client';

import { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, getCartSummary } from '@/features/cart';
import type { CartSummaryResponse } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { getAddresses, addAddress, getProfile, type Address } from '@/lib/api/users';
import {
  createOrder,
  getUserOrders,
  type PaymentMethod,
  type ShippingMethod,
} from '@/lib/api/orders';
import { getWalletData } from '@/lib/api/wallet';
import { MP_MINIMUM_AMOUNT, DEFAULT_NEW_ADDRESS } from '../constants';
import type {
  UseCheckoutReturn,
  PaymentMethod as CheckoutPaymentMethod,
  ShippingMethod as CheckoutShippingMethod,
} from '../types';
import { formatPrice } from '../utils';

export function useCheckout(): UseCheckoutReturn {
  const { push } = useRouter();
  const { items, clearCart, isLoading, isLoaded } = useCart();
  const { user, token, setCredentials } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const cartInitialized = useRef(false);

  // State
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('transfer');
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>('shipping');

  interface AddressesState {
    addresses: Address[];
    selectedAddressId: string;
    isAddingAddress: boolean;
  }

  type AddressesAction =
    | { type: 'SET'; payload: AddressesState }
    | { type: 'SET_ADDRESSES'; payload: Address[] }
    | { type: 'SELECT_ADDRESS'; payload: string }
    | { type: 'TOGGLE_ADDING'; payload: boolean };

  function addressesReducer(state: AddressesState, action: AddressesAction): AddressesState {
    switch (action.type) {
      case 'SET':
        return action.payload;
      case 'SET_ADDRESSES':
        return { ...state, addresses: action.payload };
      case 'SELECT_ADDRESS':
        return { ...state, selectedAddressId: action.payload };
      case 'TOGGLE_ADDING':
        return { ...state, isAddingAddress: action.payload };
      default:
        return state;
    }
  }

  const [addressesState, addressesDispatch] = useReducer(addressesReducer, {
    addresses: [],
    selectedAddressId: '',
    isAddingAddress: false,
  });
  const { addresses, selectedAddressId, isAddingAddress } = addressesState;
  const setSelectedAddressId = (id: string) =>
    addressesDispatch({ type: 'SELECT_ADDRESS', payload: id });
  const setIsAddingAddress = (value: boolean) =>
    addressesDispatch({ type: 'TOGGLE_ADDING', payload: value });

  const [phoneNumber, setPhoneNumber] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  interface TotalsState {
    backendTotals: CartSummaryResponse['data'] | null;
    summaryError: boolean;
    isFetchingTotals: boolean;
  }

  type TotalsAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: CartSummaryResponse['data'] }
    | { type: 'FETCH_ERROR' }
    | { type: 'RESET' };

  function totalsReducer(state: TotalsState, action: TotalsAction): TotalsState {
    switch (action.type) {
      case 'FETCH_START':
        return { ...state, isFetchingTotals: true };
      case 'FETCH_SUCCESS':
        return { backendTotals: action.payload, summaryError: false, isFetchingTotals: false };
      case 'FETCH_ERROR':
        return { ...state, summaryError: true, isFetchingTotals: false };
      case 'RESET':
        return { backendTotals: null, summaryError: false, isFetchingTotals: false };
      default:
        return state;
    }
  }

  const [totalsState, totalsDispatch] = useReducer(totalsReducer, {
    backendTotals: null,
    summaryError: false,
    isFetchingTotals: false,
  });
  const { backendTotals, summaryError, isFetchingTotals } = totalsState;

  const [mobileStep, setMobileStep] = useState(1);
  const [newAddress, setNewAddress] = useState<Partial<Address>>(DEFAULT_NEW_ADDRESS);

  // Computed
  const userName = useMemo(() => {
    if (!user) return null;
    return user.first_name ? `${user.first_name} ${user.last_name}` : user.username;
  }, [user]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => item.cartItemId && selectedItemIds.includes(item.cartItemId));
  }, [items, selectedItemIds]);

  const totalPrice = backendTotals?.subtotal || 0;
  const totalItems = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);
  const shippingCost = backendTotals?.shippingCost || 0;
  const finalTotal = backendTotals?.total || 0;

  const hasImportItems = useMemo(() => {
    return selectedItems.some((item) => {
      const isBundle =
        item.isBundle ||
        (item.title && item.title.toLowerCase().includes('bundle')) ||
        item.metadata?.includes('Bundle');
      return !isBundle && item.isImportation;
    });
  }, [selectedItems]);

  const isMpDisabled = totalPrice < MP_MINIMUM_AMOUNT;

  const hasOutOfStockSelected = useMemo(() => {
    return (backendTotals?.items ?? []).some(
      (bi) => bi.outOfStock && selectedItemIds.includes(bi.id)
    );
  }, [backendTotals, selectedItemIds]);

  // Effects
  useEffect(() => {
    if (items.length > 0 && !cartInitialized.current) {
      cartInitialized.current = true;
      const ids = items.flatMap((item) => (item.cartItemId ? [item.cartItemId] : []));
      setSelectedItemIds((prev) => {
        // Only update if the IDs have actually changed
        if (prev.length === ids.length && ids.every((id) => prev.includes(id))) {
          return prev;
        }
        return ids;
      });
    }
  }, [items]);

  useEffect(() => {
    async function fetchProfile() {
      if (token) {
        try {
          const profile = await getProfile();
          if (profile && profile.email) {
            setCredentials(profile, token);
          }
        } catch (error) {
          console.error('Failed to refresh profile', error);
        }
      }
    }
    fetchProfile();
  }, [token, setCredentials]);

  useEffect(() => {
    async function fetchAddresses() {
      if (user) {
        try {
          const data = await getAddresses();
          if (data.length > 0) {
            const defaultAddress = data.find((a) => a.is_default) || data[0];
            addressesDispatch({
              type: 'SET',
              payload: {
                addresses: data,
                selectedAddressId: defaultAddress.id,
                isAddingAddress: false,
              },
            });
          } else {
            addressesDispatch({
              type: 'SET',
              payload: { addresses: data, selectedAddressId: '', isAddingAddress: true },
            });
          }
        } catch (error) {
          console.error('Failed to load addresses', error);
          toastError('Error al cargar direcciones');
        }
      }
    }
    fetchAddresses();
  }, [user, toastError]);

  useEffect(() => {
    async function fetchBalance() {
      if (token) {
        try {
          const data = await getWalletData();
          setBalance(data.balance);
        } catch (error) {
          console.error('Failed to fetch balance', error);
        }
      }
    }
    fetchBalance();
  }, [token]);

  useEffect(() => {
    if (user?.phone) {
      const rawValue = user.phone.replace(/\D/g, '');
      const truncated = rawValue.slice(0, 10);
      let formatted = truncated;
      if (truncated.length > 0) {
        formatted = `(${truncated.slice(0, 2)}`;
        if (truncated.length > 2) formatted += `) ${truncated.slice(2, 6)}`;
        if (truncated.length > 6) formatted += ` ${truncated.slice(6, 10)}`;
      }
      void Promise.resolve().then(() => setPhoneNumber(formatted));
    }
  }, [user]);

  useEffect(() => {
    async function fetchTotals() {
      if (selectedItemIds.length > 0 && token) {
        totalsDispatch({ type: 'FETCH_START' });
        try {
          const response = await getCartSummary(shippingMethod as ShippingMethod, selectedItemIds);
          if (response.success && response.data) {
            totalsDispatch({ type: 'FETCH_SUCCESS', payload: response.data });
          } else {
            totalsDispatch({ type: 'FETCH_ERROR' });
          }
        } catch (error) {
          console.error('Failed to fetch checkout totals', error);
          totalsDispatch({ type: 'FETCH_ERROR' });
        }
      } else {
        totalsDispatch({ type: 'RESET' });
      }
    }
    fetchTotals();
  }, [selectedItemIds, shippingMethod, token]);

  useEffect(() => {
    if (paymentMethod === 'mercadopago' && finalTotal > 0 && finalTotal < MP_MINIMUM_AMOUNT) {
      void Promise.resolve().then(() => setPaymentMethod('transfer'));
    }
  }, [paymentMethod, finalTotal]);

  useEffect(() => {
    async function checkActiveOrders() {
      if (token) {
        try {
          await getUserOrders();
        } catch (error) {
          console.error('Failed to check active orders', error);
        }
      }
    }
    checkActiveOrders();
  }, [token]);

  // Mobile auto-advance logic
  useEffect(() => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (mobileStep === 1 && digits.length === 10) {
      const t = setTimeout(() => setMobileStep(2), 500);
      return () => clearTimeout(t);
    }
  }, [phoneNumber, mobileStep]);

  // Handlers
  const handleAddAddress = async () => {
    if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip_code) {
      try {
        const addressData = {
          street: newAddress.street!,
          city: newAddress.city!,
          state: newAddress.state!,
          zip_code: newAddress.zip_code!,
          country: newAddress.country || 'México',
          receiver_name: newAddress.receiver_name || '',
          is_default: addresses.length === 0,
        };
        const savedAddress = await addAddress(addressData);
        addressesDispatch({ type: 'SET_ADDRESSES', payload: [...addresses, savedAddress] });
        addressesDispatch({ type: 'SELECT_ADDRESS', payload: savedAddress.id });
        addressesDispatch({ type: 'TOGGLE_ADDING', payload: false });
        setNewAddress(DEFAULT_NEW_ADDRESS);
        toastSuccess('Dirección agregada correctamente');
        if (shippingMethod === 'shipping') {
          setTimeout(() => setMobileStep((s) => (s === 2 ? 3 : s)), 500);
        }
      } catch (error) {
        console.error('Failed to add address', error);
        toastError('Error al guardar la dirección');
      }
    } else {
      toastError('Por favor completa todos los campos requeridos');
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        shippingMethod: shippingMethod as ShippingMethod,
        addressId: shippingMethod === 'shipping' ? selectedAddressId : undefined,
        phoneNumber: phoneNumber || undefined,
        paymentMethod: paymentMethod as PaymentMethod,
        itemIds: selectedItemIds,
      };
      const response = await createOrder(orderData);

      if (paymentMethod === 'mercadopago') {
        if (response.payment?.initPoint) {
          window.location.href = response.payment.initPoint;
        } else {
          toastError('Error: No se pudo generar el link de pago');
        }
      } else {
        toastSuccess(
          paymentMethod === 'wallet'
            ? 'Compra realizada con éxito usando tu wallet'
            : 'Orden creada exitosamente'
        );
        void clearCart();
        push(`/profile/orders/${response.order.id}`);
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toastError(error instanceof Error ? error.message : 'Error al procesar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) return toastError('Tu carrito está vacío');
    if (shippingMethod === 'shipping' && !selectedAddressId)
      return toastError('Por favor selecciona una dirección de envío');
    if (hasOutOfStockSelected)
      return toastError('Retira los artículos sin stock antes de continuar');

    if (hasImportItems) {
      setShowImportWarning(true);
      return;
    }

    void handleCheckout();
  };

  const handleMobileShippingSelect = (method: CheckoutShippingMethod) => {
    setShippingMethod(method);
    if (method === 'arrange') {
      setTimeout(() => setMobileStep(3), 380);
    } else if (method === 'shipping' && selectedAddressId) {
      setTimeout(() => setMobileStep(3), 380);
    }
  };

  const handleMobileAddressSelect = (id: string) => {
    addressesDispatch({ type: 'SELECT_ADDRESS', payload: id });
    if (shippingMethod === 'shipping') {
      setTimeout(() => setMobileStep(3), 380);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = (selected: boolean) => {
    setSelectedItemIds(
      selected ? items.flatMap((item) => (item.cartItemId ? [item.cartItemId] : [])) : []
    );
  };

  return {
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
    selectedItemIds,
    isProcessing,
    backendTotals,
    summaryError,
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
    hasImportItems,
    isMpDisabled,
    hasOutOfStockSelected,
    selectedItems,
    handleAddAddress,
    handleCheckoutClick,
    handleCheckout,
    handleMobileShippingSelect,
    handleMobileAddressSelect,
    toggleItemSelection,
    toggleAllSelection,
    formatPrice,
  };
}
