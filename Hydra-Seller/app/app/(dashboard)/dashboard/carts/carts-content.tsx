'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Search24Regular,
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  Cart24Regular,
  SpinnerIos20Regular,
  People24Regular,
  Payment24Regular,
} from '@fluentui/react-icons';
import { adminCartAPI, singlesAPI, usersAPI, searchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { SafeImg } from '@/components/ui/safe-img';
import { CartItemsDesktopTable } from './components/CartItemsDesktopTable';

interface CartItem {
  id: string;
  quantity: number;
  isImportation: boolean;
  importationId?: string;
  singleId?: string;
  productData?: {
    name?: string;
    cardName?: string;
    title?: string;
    price?: string | number;
    finalPrice?: number;
    imageUrl?: string;
    img?: string;
    language?: string;
    foil?: boolean;
    isFoil?: boolean;
    lang?: string;
    expansion?: string;
    cardNumber?: string;
    variant?: string;
    owner?: {
      id: string;
      email: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

interface UserOption {
  id: string;
  email: string;
  name: string;
  username: string;
}

export default function CartsContent() {
  const { push } = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCardName, setSelectedCardName] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const response = await usersAPI.list();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let usersArray: any[] = [];
        if (Array.isArray(response)) usersArray = response;
        else if (response?.data && Array.isArray(response.data)) usersArray = response.data;
        else if (response?.success && response.data) usersArray = response.data;

        setUsers(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usersArray.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'N/A',
            username: u.username || '',
          }))
        );
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const fetchCart = async (user?: UserOption) => {
    const targetUser = user || selectedUser;
    if (!targetUser) return;
    setIsLoadingCart(true);
    try {
      const response = await adminCartAPI.getCart(targetUser.id);
      const items = response?.data || response || [];
      setCartItems(Array.isArray(items) ? items : []);
    } catch {
      toast.error('Failed to load cart');
    } finally {
      setIsLoadingCart(false);
    }
  };

  const handleSelectUser = async (user: UserOption) => {
    setSelectedUser(user);
    setProductSearch('');
    setSearchResults([]);
    await fetchCart(user);
  };

  // Step 1: Get autocomplete suggestions from Scryfall
  const handleAutocomplete = async (query: string) => {
    if (query.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }
    try {
      const response = await searchAPI.autocomplete(query);
      const suggestions = response?.data || response || [];
      setAutocompleteSuggestions(Array.isArray(suggestions) ? suggestions : []);
    } catch {
      // silently ignore autocomplete errors
    }
  };

  // Step 2: Search local + Importation for specific card
  const handleProductSearch = async (cardName: string) => {
    setSelectedCardName(cardName);
    setProductSearch(cardName);
    setAutocompleteSuggestions([]);
    setIsSearching(true);

    try {
      // Search both local inventory and Importation simultaneously
      const [localResponse, importationResponse] = await Promise.allSettled([
        singlesAPI.list(1, 10, cardName),
        singlesAPI.importationSearch(cardName, 1),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let results: any[] = [];

      // Add local products
      if (localResponse.status === 'fulfilled') {
        const localData = localResponse.value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let localResults: any[] = [];
        if (localData?.data?.data) localResults = localData.data.data;
        else if (localData?.data && Array.isArray(localData.data)) localResults = localData.data;
        else if (Array.isArray(localData)) localResults = localData;
        results = [...results, ...localResults];
      }

      // Add Importation products
      if (importationResponse.status === 'fulfilled') {
        const importationData = importationResponse.value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let importationResults: any[] = [];
        if (importationData?.data?.data) importationResults = importationData.data.data;
        else if (importationData?.data && Array.isArray(importationData.data))
          importationResults = importationData.data;
        else if (Array.isArray(importationData)) importationResults = importationData;
        // Mark as Importation if not already marked
        importationResults = importationResults.map((item) => ({
          ...item,
          isImportationImport: true,
          isLocalInventory: false,
        }));
        results = [...results, ...importationResults];
      }

      setSearchResults(results);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddToCart = async (product: any) => {
    if (!selectedUser) return;
    const productKey = product.id || product.importationId || String(Math.random());
    setAddingToCart((prev) => new Set(prev).add(productKey));
    try {
      const isImportation = !!product.importationId && !product.isLocalInventory;
      await adminCartAPI.addItem(selectedUser.id, {
        singleId: isImportation ? undefined : product.id,
        quantity: 1,
        isImportation,
        importationId: isImportation ? product.importationId : undefined,
        productData: isImportation
          ? {
              name: product.name || product.cardName || product.title,
              cardName: product.cardName || product.name,
              importationId: product.importationId,
              language: product.language || 'English',
              foil: product.foil || false,
              price: product.price,
              imageUrl: product.imageUrl || product.img,
            }
          : undefined,
      });
      toast.success('Item added to cart');
      setProductSearch('');
      setSearchResults([]);
      setSelectedCardName(null);
      setAutocompleteSuggestions([]);
      await fetchCart();
    } catch (err) {
      toast.error(err instanceof Error ? (err as Error).message : 'Failed to add item');
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!selectedUser || newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.updateItem(selectedUser.id, itemId, { quantity: newQuantity });
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
      );
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedUser) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.removeItem(selectedUser.id, itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCheckoutForUser = async () => {
    if (!selectedUser || cartItems.length === 0) return;
    setIsCheckingOut(true);
    try {
      const response = await adminCartAPI.checkoutForUser(selectedUser.id, 'arrange', 'transfer');
      const data = response?.data || response;
      const orderId = data?.order?.id || data?.id;
      setCartItems([]);
      toast.success('Orden creada exitosamente con pago por transferencia');
      if (orderId) {
        push(`/dashboard/orders/${orderId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    if (!selectedUser) return;
    if (!confirm("Clear all items from this user's cart?")) return;
    try {
      await adminCartAPI.clearCart(selectedUser.id);
      setCartItems([]);
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const getItemName = (item: CartItem) =>
    item.productData?.cardName ||
    item.productData?.name ||
    item.productData?.title ||
    'Unknown Product';

  const getItemPrice = (item: CartItem) => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') return parseFloat(pd.price.replace(/[^0-9.-]+/g, '')) || 0;
    return pd.finalPrice || 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PageLayout>
      <PageHeader title="Cart Management" description="Manage user shopping carts" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <People24Regular className="size-4" />
              Select User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y border rounded-md">
              {isLoadingUsers ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }, (_, n) => n).map((n) => (
                    <div key={`skel-${n}`} className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : ''
                    }`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cart Management Panel */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {!selectedUser ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Cart24Regular className="size-10 mx-auto mb-3 opacity-50" />
                <p>Select a user to manage their cart</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selected User Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedUser.name}&apos;s Cart</CardTitle>
                      <CardDescription>{selectedUser.email}</CardDescription>
                    </div>
                    {cartItems.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleClearCart}
                      >
                        <Delete24Regular className="size-4 mr-1" />
                        <span className="hidden sm:inline">Clear Cart</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Product Search */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Products</CardTitle>
                  <CardDescription className="text-xs">
                    Search for products to add to cart (local & import)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Type card name…"
                      value={productSearch}
                      onChange={(e) => {
                        const query = e.target.value;
                        setProductSearch(query);
                        setSearchResults([]);
                        setSelectedCardName(null);
                        handleAutocomplete(query);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && productSearch.trim()) {
                          handleProductSearch(productSearch.trim());
                        }
                      }}
                      className="pl-9"
                    />
                    {isSearching && (
                      <SpinnerIos20Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Autocomplete Suggestions */}
                  {autocompleteSuggestions.length > 0 && !selectedCardName && (
                    <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-lg">
                      {autocompleteSuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          role="button"
                          tabIndex={0}
                          className="p-2 hover:bg-muted cursor-pointer text-sm transition-colors"
                          onClick={() => handleProductSearch(suggestion)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleProductSearch(suggestion);
                            }
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-64 overflow-y-auto divide-y">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {searchResults.map((product: any, index: number) => (
                        <div
                          key={product.id || product.importationId || `search-result-${index}`}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50"
                        >
                          <SafeImg
                            src={product.img || product.imageUrl}
                            alt=""
                            className="h-24 w-18 object-cover rounded border shrink-0"
                            fallback={
                              <div className="h-24 w-18 bg-muted rounded border shrink-0 flex items-center justify-center">
                                <Cart24Regular className="size-8 text-muted-foreground opacity-20" />
                              </div>
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium truncate">
                                {product.name || product.cardName || product.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {(product.foil || product.isFoil) && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                                    FOIL
                                  </Badge>
                                )}
                                {(product.language || product.lang) && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
                                  >
                                    {product.language || product.lang}
                                  </Badge>
                                )}
                                {product.isImportationImport ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"
                                  >
                                    Import
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    Local
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              {product.expansion && <span>{product.expansion}</span>}
                              {product.cardNumber && <span>#{product.cardNumber}</span>}
                              {product.variant && product.variant !== product.expansion && (
                                <>
                                  <span className="mx-0.5">•</span>
                                  <span>{product.variant}</span>
                                </>
                              )}
                              {product.price && (
                                <>
                                  <span className="mx-0.5">•</span>
                                  <span className="font-semibold text-foreground">
                                    {typeof product.price === 'number'
                                      ? `$${product.price.toFixed(2)}`
                                      : product.price}
                                  </span>
                                </>
                              )}
                            </div>
                            {product.owner && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                                <People24Regular className="size-3" />
                                <span>
                                  {[product.owner.first_name, product.owner.last_name]
                                    .filter(Boolean)
                                    .join(' ') ||
                                    product.owner.username ||
                                    'Local Owner'}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            disabled={addingToCart.has(product.id || product.importationId)}
                            onClick={() => handleAddToCart(product)}
                          >
                            {addingToCart.has(product.id || product.importationId) ? (
                              <SpinnerIos20Regular className="size-4 animate-spin" />
                            ) : (
                              <>
                                <Add24Regular className="size-4 mr-1" /> Add
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {productSearch &&
                    !isSearching &&
                    searchResults.length === 0 &&
                    selectedCardName && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        No stock found for &quot;{selectedCardName}&quot;
                      </div>
                    )}
                  {productSearch &&
                    !isSearching &&
                    !selectedCardName &&
                    autocompleteSuggestions.length === 0 &&
                    productSearch.length >= 2 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        No matching card names found
                      </div>
                    )}
                  {(!productSearch || productSearch.length < 2) && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Type at least 2 characters to see suggestions
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cart Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cart Items ({totalItems})</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingCart ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }, (_, n) => n).map((n) => (
                        <div key={`skel-${n}`} className="flex items-center gap-3">
                          <Skeleton className="h-12 w-10 rounded" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Cart24Regular className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cart is empty. Search and add products above.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cart Cards */}
                      <div className="block sm:hidden space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-3">
                              <ProductImageZoom
                                src={item.productData?.imageUrl || item.productData?.img}
                                alt={getItemName(item)}
                                className="h-24 w-18"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{getItemName(item)}</p>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                  <span>${getItemPrice(item).toFixed(2)} each</span>
                                  <div className="flex items-center gap-1">
                                    {(item.productData?.foil || item.productData?.isFoil) && (
                                      <Badge className="text-[10px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                                        FOIL
                                      </Badge>
                                    )}
                                    {(item.productData?.language || item.productData?.lang) && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
                                      >
                                        {item.productData.language || item.productData.lang}
                                      </Badge>
                                    )}
                                    {item.isImportation ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200"
                                      >
                                        Import
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200"
                                      >
                                        Local
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {item.productData?.owner && (
                                  <div className="text-[10px] mt-1 flex items-center gap-1.5 text-muted-foreground">
                                    <People24Regular className="size-3" />
                                    <span>
                                      {[
                                        item.productData.owner.first_name,
                                        item.productData.owner.last_name,
                                      ]
                                        .filter(Boolean)
                                        .join(' ') ||
                                        item.productData.owner.username ||
                                        'Local Owner'}
                                    </span>
                                  </div>
                                )}
                                <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  {item.productData?.expansion && (
                                    <span>{item.productData.expansion}</span>
                                  )}
                                  {item.productData?.cardNumber && (
                                    <span>#{item.productData.cardNumber}</span>
                                  )}
                                  {item.productData?.variant &&
                                    item.productData.variant !== item.productData.expansion && (
                                      <>
                                        <span className="mx-0.5">•</span>
                                        <span>{item.productData.variant}</span>
                                      </>
                                    )}
                                </div>
                                <p className="text-sm font-semibold mt-1">
                                  ${(getItemPrice(item) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  disabled={updatingItems.has(item.id) || item.quantity <= 1}
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Subtract24Regular className="size-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  disabled={updatingItems.has(item.id)}
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Add24Regular className="size-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={updatingItems.has(item.id)}
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Delete24Regular className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <CartItemsDesktopTable
                        cartItems={cartItems}
                        updatingItems={updatingItems}
                        getItemName={getItemName}
                        getItemPrice={getItemPrice}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                      />

                      {/* Cart Summary */}
                      <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-sm text-muted-foreground block">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </span>
                          <span className="text-lg font-bold">
                            Subtotal: ${subtotal.toFixed(2)} MXN
                          </span>
                        </div>
                        <Button
                          onClick={handleCheckoutForUser}
                          disabled={isCheckingOut || cartItems.length === 0}
                          className="w-full sm:w-auto"
                        >
                          {isCheckingOut ? (
                            <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Payment24Regular className="size-4 mr-2" />
                          )}
                          Convertir a Orden (Transferencia)
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
