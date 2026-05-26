'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Delete24Regular, Cart24Regular } from '@fluentui/react-icons';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';

import { UserSelectionCard } from './components/UserSelectionCard';
import { ProductSearchCard } from './components/ProductSearchCard';
import { CartItemsCard } from './components/CartItemsCard';
import { CartSummaryCard } from './components/CartSummaryCard';

import { useCartsManager, type CartItem } from './hooks/useCartsManager';

export default function CartsContent() {
  const {
    state,
    dispatch,
    handleSelectUser,
    handleAutocomplete,
    handleProductSearch,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCheckoutForUser,
    handleClearCart,
  } = useCartsManager();

  const {
    users,
    isLoadingUsers,
    userSearch,
    selectedUser,
    cartItems,
    isLoadingCart,
    productSearch,
    autocompleteSuggestions,
    searchResults,
    isSearching,
    selectedCardName,
    updatingItems,
    addingToCart,
    isCheckingOut,
  } = state;

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getItemName = (item: CartItem) =>
    item.productData?.cardName ||
    item.productData?.name ||
    item.productData?.title ||
    'Unknown Product';

  const getItemPrice = (item: CartItem): number => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') return parseFloat(pd.price.replace(/[^0-9.-]+/g, '')) || 0;
    const fp = pd.finalPrice;
    if (typeof fp === 'number') return fp;
    if (typeof fp === 'string') return parseFloat(fp.replace(/[^0-9.-]+/g, '')) || 0;
    return 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PageLayout>
      <PageHeader title="Cart Management" description="Manage user shopping carts" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <UserSelectionCard
          userSearch={userSearch}
          onSearchChange={(s) => dispatch({ type: 'SET_USER_SEARCH', search: s })}
          isLoadingUsers={isLoadingUsers}
          filteredUsers={filteredUsers}
          selectedUserId={selectedUser?.id}
          onSelectUser={handleSelectUser}
        />

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

              <ProductSearchCard
                productSearch={productSearch}
                onSearchChange={(s) => {
                  dispatch({ type: 'SET_PRODUCT_SEARCH', search: s });
                  dispatch({ type: 'SET_SEARCH_RESULTS', results: [] });
                  dispatch({ type: 'SET_SELECTED_CARD', name: null });
                  void handleAutocomplete(s);
                }}
                onSearchSubmit={handleProductSearch}
                isSearching={isSearching}
                autocompleteSuggestions={autocompleteSuggestions}
                selectedCardName={selectedCardName}
                searchResults={searchResults}
                addingToCart={addingToCart}
                onAddToCart={handleAddToCart}
              />

              <CartItemsCard
                isLoadingCart={isLoadingCart}
                cartItems={cartItems}
                totalItems={totalItems}
                updatingItems={updatingItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                getItemName={getItemName}
                getItemPrice={getItemPrice}
              />

              <CartSummaryCard
                cartItemsCount={totalItems}
                subtotal={subtotal}
                isCheckingOut={isCheckingOut}
                onCheckout={handleCheckoutForUser}
              />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
