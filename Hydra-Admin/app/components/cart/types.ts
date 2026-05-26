export interface CartItem {
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
    lang?: string;
    foil?: boolean;
    isFoil?: boolean;
    expansion?: string;
    cardNumber?: string | number;
    variant?: string;
  };
}

export interface MinimalProduct {
  id?: string;
  importationId?: string;
  name?: string;
  cardName?: string;
  title?: string;
  img?: string;
  imageUrl?: string;
  price?: number | string;
  finalPrice?: number;
  foil?: boolean;
  isFoil?: boolean;
  language?: string;
  lang?: string;
  expansion?: string;
  set_name?: string;
  cardNumber?: string | number;
  variant?: string;
  stock?: number;
  isLocalInventory?: boolean;
  isImportationImport?: boolean;
}
