'use client';

import { useReducer } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ordersAPI, usersAPI, singlesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { SpinnerIos20Regular } from '@fluentui/react-icons';
import { CustomerSelectionSection } from './components/create-order-parts/CustomerSelectionSection';
import { OrderItemsSection } from './components/create-order-parts/OrderItemsSection';
import { OrderShippingSection } from './components/create-order-parts/OrderShippingSection';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isImportation: boolean;
}

interface OrderFormState {
  selectedUser: string;
  searchUser: string;
  items: OrderItem[];
  shippingMethod: string;
  paymentMethod: string;
  addressId: string;
}

type OrderFormAction =
  | { type: 'SET_FIELD'; field: keyof OrderFormState; value: unknown }
  | { type: 'RESET' };

const initialFormState: OrderFormState = {
  selectedUser: '',
  searchUser: '',
  items: [],
  shippingMethod: 'shipping',
  paymentMethod: 'mercadopago',
  addressId: '',
};

function orderFormReducer(state: OrderFormState, action: OrderFormAction): OrderFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialFormState };
    default:
      return state;
  }
}

interface UserListItem {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ProductListItem {
  id: string;
  name?: string;
  cardName?: string;
  expansion?: string;
  set_name?: string;
  variant?: string;
  price?: number;
  finalPrice?: number;
}

interface UserAddressItem {
  id: string;
  is_default?: boolean;
  street: string;
  city: string;
  zip_code: string;
}

interface CreateOrderState {
  loading: boolean;
  users: UserListItem[];
  searchProduct: string;
  products: ProductListItem[];
  searchingProducts: boolean;
  userAddresses: UserAddressItem[];
  form: OrderFormState;
}

type CreateOrderAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_USERS'; users: UserListItem[] }
  | { type: 'SET_SEARCH_PRODUCT'; query: string }
  | { type: 'SET_PRODUCTS'; products: ProductListItem[] }
  | { type: 'SET_SEARCHING_PRODUCTS'; searching: boolean }
  | { type: 'SET_USER_ADDRESSES'; addresses: UserAddressItem[] }
  | { type: 'FORM'; action: OrderFormAction }
  | { type: 'RESET_ALL' };

function createOrderReducer(state: CreateOrderState, action: CreateOrderAction): CreateOrderState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_SEARCH_PRODUCT': return { ...state, searchProduct: action.query };
    case 'SET_PRODUCTS': return { ...state, products: action.products };
    case 'SET_SEARCHING_PRODUCTS': return { ...state, searchingProducts: action.searching };
    case 'SET_USER_ADDRESSES': return { ...state, userAddresses: action.addresses };
    case 'FORM': return { ...state, form: orderFormReducer(state.form, action.action) };
    case 'RESET_ALL': return { ...initialCreateState, form: initialFormState };
    default: return state;
  }
}

const initialCreateState: CreateOrderState = {
  loading: false,
  users: [],
  searchProduct: '',
  products: [],
  searchingProducts: false,
  userAddresses: [],
  form: initialFormState,
};

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  const [state, dispatch] = useReducer(createOrderReducer, initialCreateState);
  const { loading, users, searchProduct, products, searchingProducts, userAddresses, form: formState } = state;

  const dispatchForm = (action: OrderFormAction) => dispatch({ type: 'FORM', action });

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      const usersList = response?.data || response || [];
      dispatch({ type: 'SET_USERS', users: Array.isArray(usersList) ? usersList : [] });
    } catch { console.error('Failed to fetch users'); }
  };

  const fetchUserAddresses = async (userId: string) => {
    try {
      const response = await usersAPI.get(userId);
      if (response?.addresses) {
        dispatch({ type: 'SET_USER_ADDRESSES', addresses: response.addresses });
        const defaultAddr = response.addresses.find((a: UserAddressItem) => a.is_default);
        const addrId = defaultAddr?.id || response.addresses[0]?.id || '';
        dispatchForm({ type: 'SET_FIELD', field: 'addressId', value: addrId });
      }
    } catch { console.error('Failed to fetch addresses'); }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) { dispatch({ type: 'RESET_ALL' }); void fetchUsers(); }
    onOpenChange(newOpen);
  };

  const handleSelectUser = (userId: string, label: string) => {
    dispatchForm({ type: 'SET_FIELD', field: 'selectedUser', value: userId });
    dispatchForm({ type: 'SET_FIELD', field: 'searchUser', value: label });
    if (formState.shippingMethod === 'shipping') void fetchUserAddresses(userId);
  };

  const handleShippingMethodChange = (method: string) => {
    dispatchForm({ type: 'SET_FIELD', field: 'shippingMethod', value: method });
    if (method === 'shipping' && formState.selectedUser) void fetchUserAddresses(formState.selectedUser);
  };

  const handleSearchProduct = async (query: string) => {
    dispatch({ type: 'SET_SEARCH_PRODUCT', query });
    if (query.length < 3) return;
    dispatch({ type: 'SET_SEARCHING_PRODUCTS', searching: true });
    try {
      const response = await singlesAPI.list(1, 10, query);
      const products = response?.data?.data || response?.data || [];
      dispatch({ type: 'SET_PRODUCTS', products: Array.isArray(products) ? products : [] });
    } catch { console.error('Search failed'); }
    finally { dispatch({ type: 'SET_SEARCHING_PRODUCTS', searching: false }); }
  };

  const handleAddItem = (product: ProductListItem) => {
    const existing = formState.items.find((i) => i.productId === product.id);
    if (existing) {
      dispatchForm({ type: 'SET_FIELD', field: 'items', value: formState.items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      dispatchForm({ type: 'SET_FIELD', field: 'items', value: [...formState.items, { productId: product.id, name: product.cardName || product.name || 'Unknown', quantity: 1, unitPrice: Number(product.price) || 0, isImportation: false }] });
    }
    dispatch({ type: 'SET_SEARCH_PRODUCT', query: '' });
    dispatch({ type: 'SET_PRODUCTS', products: [] });
  };

  const handleSubmit = async () => {
    if (!formState.selectedUser || formState.items.length === 0) { toast.error('Selecciona un usuario y agrega items'); return; }
    if (formState.shippingMethod === 'shipping' && !formState.addressId) { toast.error('Selecciona una dirección'); return; }
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await ordersAPI.createAsAdmin({ userId: formState.selectedUser, items: formState.items, shippingMethod: formState.shippingMethod, addressId: formState.shippingMethod === 'shipping' ? formState.addressId : undefined, paymentMethod: formState.paymentMethod });
      toast.success('Orden creada');
      onOrderCreated();
      onOpenChange(false);
    } catch { toast.error('Error al crear orden'); }
    finally { dispatch({ type: 'SET_LOADING', loading: false }); }
  };

  const filteredUsers = users.filter(u => u.first_name?.toLowerCase().includes(formState.searchUser.toLowerCase()) || u.last_name?.toLowerCase().includes(formState.searchUser.toLowerCase()) || u.email?.toLowerCase().includes(formState.searchUser.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Create an order on behalf of a user</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <CustomerSelectionSection
            searchUser={formState.searchUser}
            onSearchUserChange={(val) => dispatchForm({ type: 'SET_FIELD', field: 'searchUser', value: val })}
            filteredUsers={filteredUsers}
            selectedUserId={formState.selectedUser}
            onSelectUser={handleSelectUser}
          />

          <OrderItemsSection
            searchProduct={searchProduct}
            onSearchProductChange={handleSearchProduct}
            products={products}
            searchingProducts={searchingProducts}
            items={formState.items}
            onAddItem={handleAddItem}
            onRemoveItem={(idx) => dispatchForm({ type: 'SET_FIELD', field: 'items', value: formState.items.filter((_, i) => i !== idx) })}
            onUpdateQuantity={(idx, qty) => dispatchForm({ type: 'SET_FIELD', field: 'items', value: formState.items.map((item, i) => i === idx ? { ...item, quantity: qty } : item) })}
          />

          <OrderShippingSection
            shippingMethod={formState.shippingMethod}
            onShippingMethodChange={handleShippingMethodChange}
            paymentMethod={formState.paymentMethod}
            onPaymentMethodChange={(val) => dispatchForm({ type: 'SET_FIELD', field: 'paymentMethod', value: val })}
            addressId={formState.addressId}
            onAddressIdChange={(val) => dispatchForm({ type: 'SET_FIELD', field: 'addressId', value: val })}
            userAddresses={userAddresses}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <SpinnerIos20Regular className="mr-2 size-4 animate-spin" />}
            Create Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
