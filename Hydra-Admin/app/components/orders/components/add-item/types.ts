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
  isImportationImport?: boolean;
  isLocalInventory?: boolean;
}
