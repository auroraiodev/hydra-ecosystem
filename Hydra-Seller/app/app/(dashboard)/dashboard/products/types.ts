export interface ApiProduct {
  id: string;
  name?: string;
  cardName?: string;
  title?: string;
  price?: number | string;
  finalPrice?: number;
  stock: number;
  in_stock?: number;
  img?: string;
  foil?: boolean;
  borderless?: boolean;
  cardNumber?: string;
  expansion?: string;
  extendedArt?: boolean;
  importationId?: string;
  isLocalInventory?: boolean;
  link?: string;
  metadata?: string[];
  prerelease?: boolean;
  premierPlay?: boolean;
  surgeFoil?: boolean;
  variant?: string;
  conditions?: {
    id: string;
    name: string;
    display_name?: string;
  };
  categories?: {
    id: string;
    name: string;
    display_name?: string;
  };
  languages?: {
    id: string;
    name: string;
    display_name?: string;
  };
  rarities?: {
    id: string;
    name: string;
    display_name?: string;
  };
  tcgs?: {
    id: string;
    name: string;
    display_name?: string;
  };
  condition_id?: string;
  language_id?: string;
  category_id?: string;
  set_name?: string;
  tags?: Array<{
    id: string;
    name: string;
    display_name?: string;
  }>;
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  users_products_owner_idTousers?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  owner_name?: string | null;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  cardSet: string;
  rarity: string;
  price: number;
  stock: number;
  condition: string;
  owner: string;
  owner_id?: string;
  img?: string;
  foil?: boolean;
  borderless?: boolean;
  cardNumber?: string;
  expansion?: string;
  extendedArt?: boolean;
  importationId?: string;
  isLocalInventory: boolean;
  originLabel: string;
  link?: string;
  metadata?: string[];
  prerelease?: boolean;
  premierPlay?: boolean;
  surgeFoil?: boolean;
  variant?: string;
  language?: string;
  tcg?: string;
  createdAt: string;
  condition_id?: string;
  language_id?: string;
  category_id?: string;
  category?: string;
}

export interface ProductsResponse {
  data: ApiProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  const cardSet = apiProduct.expansion || apiProduct.set_name || apiProduct.variant || 'N/A';
  const price = apiProduct.finalPrice || apiProduct.price || 0;
  const stock = apiProduct.stock || apiProduct.in_stock || 0;
  const rarity = apiProduct.rarities?.name || apiProduct.rarities?.display_name || 'N/A';

  // Resolve language name - prioritize object, then string, then default
  const language =
    apiProduct.languages?.display_name ||
    apiProduct.languages?.name ||
    (typeof apiProduct.language_id === 'string' && apiProduct.language_id.length > 5
      ? apiProduct.language_id
      : null) ||
    'No especificado';

  // Resolve condition name - prioritize object, then default
  const conditionName = apiProduct.conditions?.display_name || apiProduct.conditions?.name || 'N/A';

  const tcg = apiProduct.tcgs?.display_name || apiProduct.tcgs?.name || 'Sin Supracategoría';

  let owner = 'Sin Propietario';
  if (apiProduct.owner?.email) {
    owner = apiProduct.owner.email;
  } else if (apiProduct.users_products_owner_idTousers?.email) {
    owner = apiProduct.users_products_owner_idTousers.email;
  } else if (apiProduct.owner_email) {
    owner = apiProduct.owner_email;
  }

  const ownerId = apiProduct.owner?.id || apiProduct.users_products_owner_idTousers?.id || '';

  // Determine if it's local inventory.
  // We default to true if not explicitly false, as most items in the singles table are local.
  const isLocal = apiProduct.isLocalInventory !== false;

  return {
    id: apiProduct.id,
    name: apiProduct.cardName || apiProduct.name || apiProduct.title || 'Sin Nombre',
    cardSet,
    rarity,
    price: typeof price === 'string' ? parseFloat(price) : price,
    stock,
    condition: conditionName,
    owner,
    owner_id: ownerId,
    img: apiProduct.img,
    foil: apiProduct.foil || false,
    borderless: apiProduct.borderless || false,
    cardNumber: apiProduct.cardNumber,
    expansion: apiProduct.expansion,
    extendedArt: apiProduct.extendedArt || false,
    importationId: apiProduct.importationId,
    isLocalInventory: isLocal,
    originLabel: isLocal ? 'Local' : 'Importación',
    link: apiProduct.link,
    metadata: apiProduct.metadata || [],
    prerelease: apiProduct.prerelease || false,
    premierPlay: apiProduct.premierPlay || false,
    surgeFoil: apiProduct.surgeFoil || false,
    language,
    tcg,
    createdAt: apiProduct.created_at,
    condition_id: apiProduct.conditions?.id || apiProduct.condition_id,
    language_id: apiProduct.languages?.id || apiProduct.language_id,
    category_id: apiProduct.categories?.id || apiProduct.category_id,
    category: apiProduct.categories?.display_name || apiProduct.categories?.name || 'Sin Categoría',
  };
}
