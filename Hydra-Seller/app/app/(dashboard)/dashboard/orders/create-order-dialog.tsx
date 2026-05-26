'use client';

import { useEffect, useReducer } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ordersAPI, usersAPI, singlesAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Add24Regular,
  Delete24Regular,
  Search24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (event: unknown, data: { open: boolean }) => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isImportation: boolean;
}

interface CreateOrderState {
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  selectedUser: string;
  searchUser: string;
  searchProduct: string;
  shippingMethod: string;
  paymentMethod: string;
  items: OrderItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  searchingProducts: boolean;
  addressId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userAddresses: any[];
}

type CreateOrderAction =
  | { type: 'SET_LOADING'; loading: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'SET_USERS'; users: any[] }
  | { type: 'SET_FIELD'; field: keyof CreateOrderState; value: unknown }
  | { type: 'SET_ITEMS'; items: OrderItem[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'SET_PRODUCTS'; products: any[] }
  | { type: 'SET_SEARCHING_PRODUCTS'; searching: boolean }
  | { type: 'SET_ADDRESS_ID'; id: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'SET_USER_ADDRESSES'; addresses: any[] }
  | { type: 'RESET' };

const orderInitial: CreateOrderState = {
  loading: false,
  users: [],
  selectedUser: '',
  searchUser: '',
  searchProduct: '',
  shippingMethod: 'shipping',
  paymentMethod: 'mercadopago',
  items: [],
  products: [],
  searchingProducts: false,
  addressId: '',
  userAddresses: [],
};

function createOrderReducer(state: CreateOrderState, action: CreateOrderAction): CreateOrderState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'SET_ITEMS': return { ...state, items: action.items };
    case 'SET_PRODUCTS': return { ...state, products: action.products };
    case 'SET_SEARCHING_PRODUCTS': return { ...state, searchingProducts: action.searching };
    case 'SET_ADDRESS_ID': return { ...state, addressId: action.id };
    case 'SET_USER_ADDRESSES': return { ...state, userAddresses: action.addresses };
    case 'RESET': return { ...orderInitial };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface CustomerSearchSectionProps {
  searchUser: string;
  selectedUser: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredUsers: any[];
  onSearchChange: (value: string) => void;
  onSelectUser: (userId: string, label: string) => void;
  onFetchAddresses: (userId: string) => void;
  shippingMethod: string;
}

function CustomerSearchSection({
  searchUser,
  selectedUser,
  filteredUsers,
  onSearchChange,
  onSelectUser,
  onFetchAddresses,
  shippingMethod,
}: CustomerSearchSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      <div className="relative">
        <Search24Regular className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search user…"
          value={searchUser}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {searchUser && (
        <div className="border rounded-md max-h-40 overflow-y-auto mt-2">
          {filteredUsers.length === 0 ? (
            <div className="p-2 text-sm text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-2 hover:bg-muted cursor-pointer flex justify-between items-center ${selectedUser === user.id ? 'bg-primary/10' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectUser(user.id, `${user.first_name || ''} ${user.last_name || ''} (${user.email})`);
                  if (shippingMethod === 'shipping') onFetchAddresses(user.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectUser(user.id, `${user.first_name || ''} ${user.last_name || ''} (${user.email})`);
                    if (shippingMethod === 'shipping') onFetchAddresses(user.id);
                  }
                }}
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
                {selectedUser === user.id && (
                  <div className="text-primary text-xs font-bold">Selected</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ProductSearchSectionProps {
  searchProduct: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  searchingProducts: boolean;
  onSearchChange: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddItem: (product: any) => void;
}

function ProductSearchSection({
  searchProduct,
  products,
  searchingProducts,
  onSearchChange,
  onAddItem,
}: ProductSearchSectionProps) {
  return (
    <>
      <div className="relative">
        <Add24Regular className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search products to add…"
          value={searchProduct}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {searchProduct && products.length > 0 && (
        <div className="border rounded-md max-h-60 overflow-y-auto mt-2 bg-background w-full shadow-lg relative z-50">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-b-0 transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => onAddItem(product)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onAddItem(product);
              }}
            >
              <div className="text-sm flex-1 min-w-0 mr-4">
                <div className="font-medium truncate">{product.cardName || product.name}</div>
                <div className="text-muted-foreground text-xs truncate">
                  {product.expansion || product.set_name || ''}{' '}
                  {product.variant ? `• ${product.variant}` : ''}
                </div>
              </div>
              <div className="text-sm font-bold whitespace-nowrap">
                ${Number(product.price || product.finalPrice || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
      {searchProduct && searchingProducts && (
        <div className="text-sm text-muted-foreground text-center py-2 flex items-center justify-center gap-2">
          <SpinnerIos20Regular className="size-3 animate-spin" />
          Buscando productos…
        </div>
      )}
      {searchProduct && !searchingProducts && products.length === 0 && searchProduct.length >= 3 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          No se encontraron productos
        </div>
      )}
    </>
  );
}

interface OrderItemsTableProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
}

function OrderItemsTable({ items, onUpdateQuantity, onRemoveItem }: OrderItemsTableProps) {
  return (
    <div className="border rounded-md mt-2">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-right w-20">Qty</th>
            <th className="p-2 text-right w-24">Price</th>
            <th className="p-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                No items added
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.productId} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-right">
                  <Input
                    type="number"
                    min={1}
                    value={String(item.quantity)}
                    onChange={(e) =>
                      onUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                    }
                    className="h-7 w-16 text-right ml-auto"
                  />
                </td>
                <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={() => onRemoveItem(item.productId)}
                  >
                    <Delete24Regular className="size-4" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {items.length > 0 && (
          <tfoot className="bg-muted/50 font-medium">
            <tr>
              <td colSpan={2} className="p-2 text-right">
                Total:
              </td>
              <td className="p-2 text-right">
                ${items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  const [state, dispatch] = useReducer(createOrderReducer, orderInitial);
  const { loading, users, selectedUser, searchUser, searchProduct, shippingMethod, paymentMethod, items, products, searchingProducts, addressId, userAddresses } = state;

  // Fetch users once on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenChange = (event: unknown, data: { open: boolean }) => {
    if (data.open) {
      dispatch({ type: 'RESET' });
      fetchUsers();
    }
    onOpenChange(event, data);
  };

  useEffect(() => {
    if (shippingMethod === 'shipping' && selectedUser) {
      fetchUserAddresses(selectedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethod]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      if (response && response.data) {
        dispatch({ type: 'SET_USERS', users: Array.isArray(response.data) ? response.data : [] });
      } else if (Array.isArray(response)) {
        dispatch({ type: 'SET_USERS', users: response });
      }
    } catch {
      console.error('Failed to fetch users');
    }
  };

  const fetchUserAddresses = async (userId: string) => {
    try {
      const response = await usersAPI.get(userId);
      if (response && response.addresses) {
        dispatch({ type: 'SET_USER_ADDRESSES', addresses: response.addresses });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultAddr = response.addresses.find((a: any) => a.is_default);
        if (defaultAddr) dispatch({ type: 'SET_ADDRESS_ID', id: defaultAddr.id });
        else if (response.addresses.length > 0) dispatch({ type: 'SET_ADDRESS_ID', id: response.addresses[0].id });
      }
    } catch {
      console.error('Failed to fetch addresses');
    }
  };

  const handleSearchProduct = async (query: string) => {
    dispatch({ type: 'SET_FIELD', field: 'searchProduct', value: query });
    if (query.length < 3) return;

    dispatch({ type: 'SET_SEARCHING_PRODUCTS', searching: true });
    try {
      const response = await singlesAPI.list(1, 10, query);
      if (response && response.data) {
        dispatch({ type: 'SET_PRODUCTS', products: response.data });
      }
    } catch {
      console.error('Search failed');
    } finally {
      dispatch({ type: 'SET_SEARCHING_PRODUCTS', searching: false });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddItem = (product: any) => {
    const existing = items.find((i) => i.productId === product.id);
    let newItems: OrderItem[];
    if (existing) {
      newItems = items.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [
        ...items,
        {
          productId: product.id,
          name: product.cardName || product.name || 'Unknown Product',
          quantity: 1,
          unitPrice: Number(product.price) || 0,
          isImportation: false,
        },
      ];
    }
    dispatch({ type: 'SET_ITEMS', items: newItems });
    dispatch({ type: 'SET_FIELD', field: 'searchProduct', value: '' });
    dispatch({ type: 'SET_PRODUCTS', products: [] });
  };

  const handleRemoveItem = (productId: string) => {
    dispatch({ type: 'SET_ITEMS', items: items.filter((item) => item.productId !== productId) });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    dispatch({ type: 'SET_ITEMS', items: items.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item)) });
  };

  const handleSubmit = async () => {
    if (!selectedUser || items.length === 0) {
      toast.error('Please select a user and add items');
      return;
    }

    if (shippingMethod === 'shipping' && !addressId) {
      toast.error('Please select a shipping address');
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await ordersAPI.createAsAdmin({
        userId: selectedUser,
        items,
        shippingMethod,
        addressId: shippingMethod === 'shipping' ? addressId : undefined,
        paymentMethod,
      });

      toast.success('Order created successfully');
      onOrderCreated();
      onOpenChange(null, { open: false });
    } catch {
      toast.error('Failed to create order');
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.first_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Create an order on behalf of a user</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <CustomerSearchSection
            searchUser={searchUser}
            selectedUser={selectedUser}
            filteredUsers={filteredUsers}
            onSearchChange={(v) => dispatch({ type: 'SET_FIELD', field: 'searchUser', value: v })}
            onSelectUser={(id, label) => {
              dispatch({ type: 'SET_FIELD', field: 'selectedUser', value: id });
              dispatch({ type: 'SET_FIELD', field: 'searchUser', value: label });
            }}
            onFetchAddresses={fetchUserAddresses}
            shippingMethod={shippingMethod}
          />

          <div className="space-y-2">
            <Label>Items</Label>
            <ProductSearchSection
              searchProduct={searchProduct}
              products={products}
              searchingProducts={searchingProducts}
              onSearchChange={handleSearchProduct}
              onAddItem={handleAddItem}
            />
            <OrderItemsTable
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shipping Method</Label>
                <Select
                  value={shippingMethod}
                  onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'shippingMethod', value: v })}
                >
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
              <Select
                value={paymentMethod}
                onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'paymentMethod', value: v })}
              >
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
                <Select value={addressId} onValueChange={(id) => dispatch({ type: 'SET_ADDRESS_ID', id })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select address" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {userAddresses.map((addr: any) => (
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(null, { open: false })}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <SpinnerIos20Regular className="mr-2 size-4 animate-spin" />}
            Create Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
