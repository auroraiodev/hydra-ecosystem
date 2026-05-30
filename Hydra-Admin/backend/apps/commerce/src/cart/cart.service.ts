import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@hydra/database';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { CatalogClient } from '../catalog/catalog.client.js';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly MTG_TCG_ID = 'bd789d3f-5569-4971-890e-e261e145e42c';

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogClient: CatalogClient,
  ) {}

  /**
   * Helper to extract a numeric price from various possible fields in productData
   */
  private extractPriceFromProductData(productData: any): number {
    if (!productData) return 0;

    const numericPrice =
      Number(productData.finalPrice) ||
      Number(productData.price_mxn_importation) ||
      Number(productData.unitPrice) ||
      Number(productData.unit_price) ||
      Number(productData.price_mxn) ||
      0;

    if (numericPrice > 0) return numericPrice;

    const priceStr = productData.price;
    if (typeof priceStr === 'string') {
      const clean = priceStr.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }

    return 0;
  }

  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId: string) {
    const cart = await this.prisma.carts.upsert({
      where: { user_id: userId },
      update: {},
      create: {
        user_id: userId,
      },
      include: {
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
                owner: {
                  include: {
                    roles: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (cart.items) {
      cart.items.sort((a, b) => a.id.localeCompare(b.id));
    }

    return cart;
  }

  /**
   * Merge guest cart items into user cart
   */
  async mergeGuestCart(userId: string, items: AddCartItemDto[]) {
    this.logger.log(`Merging ${items.length} guest cart items for user ${userId}`);

    for (const item of items) {
      try {
        await this.addItem(userId, item);
      } catch (error) {
        this.logger.error(`Failed to merge item ${JSON.stringify(item)} for user ${userId}`, error);
      }
    }

    return this.getCart(userId);
  }

  /**
   * Get cart for user with full product details.
   */
  async getCart(userId: string) {
    try {
      const cart = await this.getOrCreateCart(userId);
      this.logger.log(`Getting cart for user ${userId}, items count: ${cart.items.length}`);

      const itemsToRefetch = cart.items
        .map((i) => {
          const tcgId = (i as any).tcg_id || (i.singles as any)?.tcg_id;
          if (tcgId && tcgId !== this.MTG_TCG_ID) return null;

          const importationId = (i as any).importation_id || (i.singles as any)?.importationId;
          if (!importationId) return null;

          return {
            importationId: importationId,
            name: String(
              ((i as any).product_data as Record<string, string>)?.name ||
                ((i as any).product_data as Record<string, string>)?.cardName ||
                (i.singles as any)?.cardName ||
                'Producto',
            ),
          };
        })
        .filter((i): i is { importationId: string; name: string } => i !== null);

      this.logger.debug(`Refetching prices for ${itemsToRefetch.length} importation items`);

      const freshPricingMap = new Map();
      if (itemsToRefetch.length > 0) {
        try {
          const freshPrices = await this.catalogClient.getBatchPrices(itemsToRefetch);
          freshPrices.forEach((p) => {
            if (p.importationId) {
              freshPricingMap.set(p.importationId, p);
            }
          });
          this.logger.log(`Fetched fresh pricing for ${freshPricingMap.size} importation items`);
        } catch (priceError: any) {
          this.logger.warn(`Failed to fetch fresh pricing for cart items: ${priceError.message}`);
        }
      }

      const transformedItems = await this.transformCartItemsWithDetails(
        cart.items,
        freshPricingMap,
      );
      this.logger.log(`Successfully transformed ${transformedItems.length} cart items`);

      await this.recalculatePrices(cart.items, transformedItems);

      return transformedItems;
    } catch (error) {
      this.logger.error(`Error getting cart for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Recalculate unit_price for all cart items from current product data and store it.
   */
  private async recalculatePrices(rawItems: any[], transformedItems: any[]) {
    const updates: Promise<any>[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      const transformed = transformedItems[i];
      if (!transformed?.productData) continue;

      let unitPrice = Number(transformed.productData.finalPrice) || 0;

      if (unitPrice === 0 && !raw.is_importation && raw.singles) {
        const single = raw.singles;
        const basePrice = Number(single.price) || Number(single.finalPrice) || 0;
        const discountPercent = single.conditions?.discount || 0;
        unitPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
      }

      const storedPrice =
        raw.unit_price !== null && raw.unit_price !== undefined
          ? Math.round(Number(raw.unit_price) * 100) / 100
          : null;

      if (storedPrice !== unitPrice) {
        updates.push(
          this.prisma.cart_items.update({
            where: { id: raw.id },
            data: { unit_price: unitPrice },
          }),
        );
        transformed.productData.finalPrice = unitPrice;
        transformed.productData.price = `$${unitPrice.toFixed(2)} MXN`;
      }
    }

    if (updates.length > 0) {
      this.logger.log(`Recalculating unit_price for ${updates.length} cart items`);
      await Promise.all(updates);
    }
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, addItemDto: AddCartItemDto) {
    const { singleId, quantity, isImportation, importationId, productData } = addItemDto;

    if (!isImportation && !singleId) {
      throw new BadRequestException('singleId is required for local products');
    }

    if (isImportation) {
      if (!importationId) {
        throw new BadRequestException('importationId is required for Importation products');
      }
      if (!productData) {
        throw new BadRequestException('productData is required for Importation products');
      }
      const hasName = productData.name || productData.cardName || (productData as any).title;
      if (!hasName) {
        throw new BadRequestException('productData must contain a name identifier');
      }
    }

    const cart = await this.getOrCreateCart(userId);

    let existingItem;
    if (!isImportation && singleId) {
      existingItem = await this.prisma.cart_items.findFirst({
        where: {
          cart_id: cart.id,
          single_id: singleId,
          is_importation: false,
        },
      });
    } else if (isImportation && importationId) {
      existingItem = await this.prisma.cart_items.findFirst({
        where: {
          cart_id: cart.id,
          importation_id: importationId,
          is_importation: true,
        },
      });
    }

    if (existingItem) {
      const updateData: any = {
        quantity: existingItem.quantity + quantity,
      };

      if (productData) {
        updateData.product_data = this.extractMinimalProductData(productData);
      }

      const updatedItem = await this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: updateData,
        include: {
          singles: {
            include: {
              categories: true,
              conditions: true,
              languages: true,
            },
          },
        },
      });

      return await this.transformCartItemWithDetails(updatedItem);
    }

    let finalImportationId = isImportation ? importationId : null;
    let finalTcgId = (addItemDto as any).tcgId || null;

    if (!isImportation && singleId) {
      const single = await this.prisma.singles.findUnique({
        where: { id: singleId },
        select: { importationId: true, tcg_id: true },
      });
      if (single?.importationId) {
        finalImportationId = single.importationId;
      }
      if (single?.tcg_id) {
        finalTcgId = single.tcg_id;
      }
    }

    const itemData: any = {
      cart_id: cart.id,
      single_id: isImportation ? null : singleId,
      quantity,
      is_importation: isImportation,
      importation_id: finalImportationId,
      tcg_id: finalTcgId,
    };

    if (productData) {
      itemData.product_data = this.extractMinimalProductData(productData);
    }

    const newItem = await this.prisma.cart_items.create({
      data: itemData,
      include: {
        singles: {
          include: {
            categories: true,
            conditions: true,
            languages: true,
          },
        },
      },
    });

    return await this.transformCartItemWithDetails(newItem);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cart_items.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const updatedItem = await this.prisma.cart_items.update({
      where: { id: itemId },
      data: {
        quantity: updateDto.quantity,
      },
      include: {
        singles: {
          include: {
            categories: true,
            conditions: true,
            languages: true,
          },
        },
      },
    });

    return await this.transformCartItemWithDetails(updatedItem);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cart_items.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cart_items.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Item removed from cart' };
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cart_items.deleteMany({
      where: { cart_id: cart.id },
    });

    return { success: true, message: 'Cart cleared' };
  }

  private async transformCartItemsWithDetails(items: any[], freshPricingMap?: Map<string, any>) {
    const transformedItems = await Promise.all(
      items.map(async (item, index) => {
        try {
          const importationId = item.importation_id || item.singles?.importationId;
          const freshPricing = importationId ? freshPricingMap?.get(importationId) : null;
          return await this.transformCartItemWithDetails(item, freshPricing);
        } catch (error) {
          this.logger.error(`Error transforming cart item ${index} (id: ${item.id}):`, error);
          return {
            id: item.id,
            quantity: item.quantity,
            isImportation: item.is_importation,
            importationId: item.importation_id,
            singleId: item.single_id,
            productData: null,
            error: 'Failed to load product details',
          };
        }
      }),
    );
    return transformedItems;
  }

  private async transformCartItemWithDetails(item: any, freshPricing?: any) {
    let productData: any;

    try {
      if (item.is_importation) {
        if (!item.importation_id) {
          this.logger.warn(
            `Cart item ${item.id} is marked as Importation but has no importation_id`,
          );
          throw new InternalServerErrorException('Importation item missing importation_id');
        }
        productData = await this.getImportationProductDetails(
          item.importation_id,
          (item.product_data as Record<string, unknown>) || {},
          freshPricing,
        );
      } else {
        if (!item.singles) {
          this.logger.warn(`Cart item ${item.id} is marked as local but has no singles record`);
          throw new InternalServerErrorException('Local item missing singles record');
        }
        productData = await this.getLocalProductDetails(item.singles);
      }

      if (!productData) {
        this.logger.warn(`Failed to get product data for cart item ${item.id}`);
        throw new InternalServerErrorException('Failed to get product data');
      }

      return {
        id: item.id,
        quantity: item.quantity,
        isImportation: item.is_importation,
        importationId: item.importation_id,
        singleId: item.single_id,
        tcgId: item.tcg_id || item.singles?.tcg_id,
        unit_price: item.unit_price,
        productData,
      };
    } catch (error) {
      this.logger.error(`Error transforming cart item ${item.id}:`, error);
      throw error;
    }
  }

  private async getImportationProductDetails(
    importationId: string,
    storedData: Record<string, unknown>,
    freshPricing?: any,
  ): Promise<any> {
    try {
      const cardName =
        (storedData.cardName as string) ||
        (storedData.name as string) ||
        (storedData.title as string) ||
        '';

      const priceString = freshPricing?.priceString || (storedData.price as string) || '';
      const finalPrice =
        Number(freshPricing?.finalPrice) || this.extractPriceFromProductData(storedData);

      const basePriceMXN =
        Number(freshPricing?.basePriceMXN) || Number(storedData.basePriceMXN) || finalPrice;
      const _importFeeMXN =
        Number(freshPricing?.importFeeMXN) || Number(storedData.importFeeMXN) || 0;

      const localStockMatch = await this.prisma.singles.findFirst({
        where: {
          importationId: importationId,
          stock: { gt: 0 },
          isLocalInventory: true,
        },
      });

      const price_mxn_importation =
        Number(freshPricing?.price_mxn_importation) ||
        Number(storedData.price_mxn_importation) ||
        basePriceMXN;
      const price_mxn_local =
        Number(freshPricing?.price_mxn_local) || Number(storedData.price_mxn_local) || finalPrice;

      return {
        importationId,
        name: cardName,
        cardName,
        price: priceString,
        price_mxn: finalPrice,
        price_mxn_importation,
        price_mxn_local,

        isLocalInventory: !!localStockMatch,
        source: localStockMatch ? 'hybrid' : 'importation',
        immediateDelivery: !!localStockMatch,
        imageUrl: storedData.imageUrl || storedData.img || '',
        language: storedData.language || 'Inglés',
        foil: storedData.foil === true || storedData.foil === 'true' || storedData.foil === 1,
        cardNumber: (storedData.cardNumber as string) || '',
        expansion: (storedData.expansion as string) || '',
        variant: (storedData.variant as string) || '',
        metadata: (storedData.metadata as string[]) || [],
      };
    } catch (error) {
      this.logger.error(
        `Error processing Importation product details for ${importationId}:`,
        error,
      );
      return {
        ...storedData,
        importationId,
        isLocalInventory: false,
        source: 'importation',
        price: storedData.price || '',
        finalPrice: 0,
      };
    }
  }

  /**
   * Transform local product to standard format (inline version of SearchService.transformLocalProductToImportationFormat).
   */
  private transformLocalProductToImportationFormat(single: any): any {
    const getNumericValue = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (
        typeof value === 'object' &&
        'toNumber' in value &&
        typeof (value as any).toNumber === 'function'
      ) {
        const numValue = (value as any).toNumber();
        return typeof numValue === 'number' ? numValue : 0;
      }
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const productRecord = single as Record<string, unknown>;
    const conditions = productRecord.conditions as { discount?: number } | null | undefined;
    const discountPercent = conditions?.discount || 0;
    const stockCount = typeof productRecord.stock === 'number' ? productRecord.stock : 0;

    const basePrice = getNumericValue(productRecord.price) || 0;
    const finalPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
    let priceFormatted = `$${basePrice.toFixed(2)} MXN`;
    if (discountPercent > 0) {
      priceFormatted = `$${finalPrice.toFixed(2)} MXN`;
    }

    const categories = productRecord.categories as { name?: string } | null | undefined;
    const categoryName = categories?.name || 'SINGLES';

    const conditionWithName = productRecord.conditions as
      | { name?: string; display_name?: string }
      | null
      | undefined;
    const conditionName = conditionWithName?.display_name || conditionWithName?.name || 'Near Mint';

    const languages = productRecord.languages as
      | { name?: string; display_name?: string; code?: string }
      | null
      | undefined;
    const languageName = languages?.display_name || languages?.name || 'Inglés';

    const tcgs = productRecord.tcgs as { name?: string } | null | undefined;

    const metadata: string[] = Array.isArray(productRecord.metadata)
      ? [...(productRecord.metadata as string[])]
      : [];
    if (productRecord.foil === true && !metadata.includes('Foil')) {
      metadata.push('Foil');
    }

    const importationIdString = productRecord.importationId
      ? String(productRecord.importationId)
      : null;
    const languageCode = languages?.code || 'EN';
    const link = importationIdString
      ? `https://www.importationmtg.com/en/products/detail/${importationIdString}?lang=${languageCode}`
      : '';

    return {
      id: productRecord.id as string,
      cardName: (productRecord.cardName as string) || '',
      cardNumber: (productRecord.cardNumber as string) || '',
      category: categoryName,
      condition: conditionName,
      expansion: (productRecord.expansion as string) || '',
      extendedArt: metadata.includes('Extended Art') || productRecord.extendedArt === true,
      finalPrice,
      foil: productRecord.foil === true,
      importationId: importationIdString,
      img: (productRecord.img as string) || '',
      isLocalInventory: stockCount > 0 ? true : Boolean(productRecord.isLocalInventory),
      language: languageName,
      link,
      metadata,
      prerelease: metadata.includes('Prerelease') || productRecord.prerelease === true,
      premierPlay: metadata.includes('Premier Play') || productRecord.premierPlay === true,
      price: priceFormatted,
      basePriceMXN: finalPrice,
      importFeeMXN: getNumericValue(productRecord.importFeeMXN),
      price_mxn_local: getNumericValue(productRecord.priceMxnLocal) || undefined,
      price_mxn_importation: getNumericValue(productRecord.priceMxnImportation) || undefined,
      stock: stockCount,
      immediateDelivery: stockCount > 0,
      tags: Array.isArray(productRecord.tags) ? productRecord.tags : [],
      variant: (productRecord.expansion as string) || null,
      tcgId: productRecord.tcg_id || productRecord.tcgId,
      tcg: tcgs?.name || (productRecord.tcg_id === this.MTG_TCG_ID ? 'MAGIC' : 'OTHER'),
      soldBy:
        (productRecord.owner as any)?.is_hydra_alias === true
          ? 'Hydra'
          : (productRecord.owner as any)?.store_name || 'Hydra',
      storeLogo: (productRecord.owner as any)?.store_logo_url || null,
    };
  }

  private async getLocalProductDetails(single: any): Promise<any> {
    if (!single) {
      this.logger.warn('getLocalProductDetails called with null/undefined single');
      return null;
    }

    try {
      const transformed = this.transformLocalProductToImportationFormat(single);

      if (!transformed) {
        this.logger.warn(`Failed to transform local product ${single.id}`);
        return null;
      }

      const currentPrice = this.extractPriceFromProductData(single);
      const discountPercent = single.conditions?.discount || 0;
      const discountedPrice = Math.round(currentPrice * (1 - discountPercent / 100) * 100) / 100;

      transformed.finalPrice = discountedPrice;

      const { img, owner: _owner, ...cleanTransformed } = transformed;

      let selectedPrice: number;
      if (single.tcg_id === this.MTG_TCG_ID) {
        const isImportationImport =
          !!cleanTransformed.importationId && !cleanTransformed.isLocalInventory;
        const hasPersonalMetadata =
          (cleanTransformed.metadata || []).includes('Personal') ||
          (cleanTransformed.tags || []).some((t: string) => t === 'Personal' || t === 'personal');

        const useImportPrice = isImportationImport || hasPersonalMetadata;

        selectedPrice = useImportPrice
          ? cleanTransformed.price_mxn_importation ||
            cleanTransformed.basePriceMXN ||
            discountedPrice ||
            0
          : cleanTransformed.price_mxn_local ?? discountedPrice ??0;
      } else {
        selectedPrice = cleanTransformed.price_mxn_local || discountedPrice || 0;
      }

      const priceString = selectedPrice > 0 ? `$${selectedPrice.toFixed(2)} MXN` : '';

      return {
        ...cleanTransformed,
        price: priceString,
        price_mxn: discountedPrice || 0,
        price_mxn_importation:
          cleanTransformed.price_mxn_importation ||
          cleanTransformed.basePriceMXN ||
          discountedPrice ||
          0,
        price_mxn_local: cleanTransformed.price_mxn_local || discountedPrice || 0,
        imageUrl: cleanTransformed.imageUrl || img || '',
      };
    } catch (error) {
      this.logger.error(`Error in getLocalProductDetails for single ${single.id}:`, error);
      throw error;
    }
  }

  private extractMinimalProductData(productData: Record<string, unknown>): Record<string, unknown> {
    const name = productData.cardName || productData.name || (productData as any).title || '';
    const importationIdValue = productData.importationId || '';
    const language = productData.language || 'Inglés';
    const foil = productData.foil === true || productData.foil === 'true' || productData.foil === 1;

    const category = productData.category;
    const tcg = productData.tcg;
    const isLocal = productData.isLocal;
    const idLocal = productData.idLocal;
    const isFoil = productData.isFoil;

    return {
      name,
      importationId: importationIdValue,
      language,
      foil,
      category,
      tcg,
      isLocal,
      idLocal,
      isFoil,
      price: productData.price,
      imageUrl: productData.imageUrl,
      cardName: name,
      cardNumber: productData.cardNumber,
      expansion: productData.expansion,
      variant: productData.variant,
      condition: productData.condition,
      price_mxn_importation: productData.price_mxn_importation,
      price_mxn_local: productData.price_mxn_local,
    };
  }

  /**
   * Get cart summary with calculated totals
   */
  async getCartSummary(userId: string, shippingMethod?: string, itemIds?: string[]) {
    let cartItems = await this.getCart(userId);

    if (itemIds && itemIds.length > 0) {
      cartItems = cartItems.filter((item) => itemIds.includes(item.id));
    }

    let subtotal = 0;
    let itemCount = 0;
    let hasImportItems = false;

    for (const cartItem of cartItems) {
      const productData = cartItem.productData;
      if (!productData) continue;

      itemCount += cartItem.quantity;

      const unitPrice = this.extractPriceFromProductData(productData);
      subtotal += unitPrice * cartItem.quantity;

      if (
        cartItem.isImportation &&
        !productData.isLocalInventory &&
        !productData.immediateDelivery
      ) {
        hasImportItems = true;
      }
    }

    let shipping = 0;
    if (shippingMethod === 'shipping') {
      const shippingSetting = await (this.prisma as any).admin_settings.findUnique({
        where: { key: 'shippingCost' },
      });
      shipping = shippingSetting ? parseFloat(shippingSetting.value) : 280;
    }

    const total = Math.round((subtotal + shipping) * 100) / 100;

    return {
      items: cartItems.map((item) => {
        const itemUnitPrice = this.extractPriceFromProductData(item.productData);
        return {
          id: item.id,
          name: item.productData?.name || item.productData?.cardName || 'Producto',
          quantity: item.quantity,
          unitPrice: itemUnitPrice,
          total: Math.round(itemUnitPrice * item.quantity * 100) / 100,
          stock: item.productData?.stock,
          outOfStock: item.productData?.outOfStock,
        };
      }),
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: shipping,
      total,
      itemCount,
      hasImportItems,
    };
  }
}
