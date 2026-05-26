'use client';

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
    expansion?: string;
  };
}

interface CartManagementDialogSummaryProps {
  cartItems: CartItem[];
}

export function CartManagementDialogSummary({ cartItems }: CartManagementDialogSummaryProps) {
  const getItemPrice = (item: CartItem): number => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') return parseFloat(pd.price.replace(/[^0-9.-]+/g, '')) || 0;
    return pd.finalPrice || 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="border-t pt-3 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {totalItems} item{totalItems !== 1 ? 's' : ''}
      </span>
      <span className="font-semibold">Subtotal: ${subtotal.toFixed(2)} MXN</span>
    </div>
  );
}