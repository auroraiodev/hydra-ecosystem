import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { SearchService } from '../../apps/catalog/src/search/search.service.js';
import { ImportationService } from '../../apps/catalog/src/importation/importation.service.js';
import { CurrencyService } from '../../apps/catalog/src/importation/currency.service.js';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly MTG_TCG_ID = 'bd789d3f-5569-4971-890e-e261e145e42c';

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly importationService: ImportationService,
    private readonly currencyService: CurrencyService,
  ) {}

  /**
   * Helper to extract a numeric price from various possible fields in productData
   */
  private extractPriceFromProductData(productData: any): number {
    if (!productData) return 0;

    // Try numeric fields first (must be > 0)
    const numericPrice =
      Number(productData.finalPrice) ||
      Number(productData.price_mxn_importation) ||
      Number(productData.unitPrice) ||
      Number(productData.unit_price) ||
      Number(productData.price_mxn) ||
      0;

    if (numericPrice > 0) return numericPrice;

    // Fallback to string parsing (handles "$1,234.56 MXN")
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
   * Uses upsert to handle race conditions atomically
   */
  async getOrCreateCart(userId: string) {
    const cart = await this.prisma.carts.upsert({
      where: { user_id: userId },
      update: {}, // No update needed if cart exists
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

    // Sort items by id after fetching (since orderBy can't be used inside include)
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

    // Process items sequentially to ensure correct quantity updates
    // We could optimize this with a bulk operation but reuse of addItem logic provides safety/consistency
    for (const item of items) {
      try {
        await this.addItem(userId, item);
      } catch (error) {
        this.logger.error(`Failed to merge item ${JSON.stringify(item)} for user ${userId}`, error);
        // Continue with other items even if one fails
      }
    }

    return this.getCart(userId);
  }

  /**
   * Get cart for user with full product details.
   * Recalculates and stores unit_price for every item on each fetch
   * so prices are always current (picks up product price changes automatically).
   */
  async getCart(userId: string) {
    try {
      const cart = await this.getOrCreateCart(userId);
      this.logger.log(`Getting cart for user ${userId}, items count: ${cart.items.length}`);
      // Batch fetch fresh prices for all items in the cart that have an importation ID
      // Only for Magic: The Gathering (tcg_id match)
      const itemsToRefetch = cart.items
        .map((i) => {
          // Check if it's MTG (either stored in tcg_id or in the linked single)
          const tcgId = i.tcg_id || i.singles?.tcg_id;
          if (tcgId && tcgId !== this.MTG_TCG_ID) return null;

          // Normalize importationId lookup from either cart_item or linked single
          const importationId = i.importation_id || i.singles?.importationId;
          if (!importationId) return null;

          return {
            importationId: importationId,
            name: String(
              (i.product_data as Record<string, string>)?.name ||
                (i.product_data as Record<string, string>)?.cardName ||
                i.singles?.cardName ||
                'Producto',
            ),
          };
        })
        .filter((i): i is { importationId: string; name: string } => i !== null);

      this.logger.debug(`Refetching prices for ${itemsToRefetch.length} importation items`);

      const freshPricingMap = new Map();
      if (itemsToRefetch.length > 0) {
        try {
          const freshPrices = await this.importationService.getBatchPrices(itemsToRefetch);
          freshPrices.forEach((p) => {
            if (p.importationId) {
              freshPricingMap.set(p.importationId, p);
            }
          });
          this.logger.log(`Fetched fresh pricing for ${freshPricingMap.size} importation items`);
        } catch (priceError) {
          this.logger.warn(`Failed to fetch fresh pricing for cart items: ${priceError.message}`);
        }
      }

      const transformedItems = await this.transformCartItemsWithDetails(
        cart.items,
        freshPricingMap,
      );
      this.logger.log(`Successfully transformed ${transformedItems.length} cart items`);

      // Recalculate and persist unit_price for every item so stored prices stay current
      await this.recalculatePrices(cart.items, transformedItems);

      return transformedItems;
    } catch (error) {
      this.logger.error(`Error getting cart for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Recalculate unit_price for all cart items from current product data and store it.
   * - Local items: price from singles table (condition discount applied)
   * - Importation items: price from stored product_data
   */
  private async recalculatePrices(rawItems: any[], transformedItems: any[]) {
    const updates: Promise<any>[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      const transformed = transformedItems[i];
      if (!transformed?.productData) continue;

      // Always trust the fresh price from productData (updated during transformation)
      // This includes local condition discounts if they were applied in getLocalProductDetails
      let unitPrice = Number(transformed.productData.finalPrice) || 0;

      // Resiliency fallback for local products if finalPrice is missing
      if (unitPrice === 0 && !raw.is_importation && raw.singles) {
        const single = raw.singles;
        const basePrice = Number(single.price) || Number(single.finalPrice) || 0;
        const discountPercent = single.conditions?.discount || 0;
        unitPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
      }

      // Only update if unit_price has changed (avoid unnecessary writes)
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
        // Also update the returned productData so the frontend gets the fresh price
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

    // Validate that we have the required IDs
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
      // Relaxed validation: we now trust the frontend's refactored data
      // but ensure basic identifiers are present
      const hasName = productData.name || productData.cardName || productData.title;
      if (!hasName) {
        throw new BadRequestException('productData must contain a name identifier');
      }
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    // For local products, check by single_id
    // For Importation products, check by importation_id
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
      // Update quantity
      // For local products, don't update product_data (we get it from singles table)
      // For Importation products, update product_data with minimal required fields
      const updateData: any = {
        quantity: existingItem.quantity + quantity,
      };

      if (productData) {
        // Store minimal required data for all products
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

    // Create new cart item
    // For local products: store single_id, and copy importationId/tcgId from the single if available
    // For Importation products: store minimal required data in product_data
    let finalImportationId = isImportation ? importationId : null;
    let finalTcgId = addItemDto.tcgId || null;

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
      // Store minimal required data for all products
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

  /**
   * Transform cart items to include full product data with details from search
   * This method searches for product details like in search and returns standard format
   */
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

  /**
   * Transform single cart item with full product details
   * Searches for product details and returns in standard format (like search)
   */
  private async transformCartItemWithDetails(item: any, freshPricing?: any) {
    let productData: any;

    try {
      if (item.is_importation) {
        // For Importation products, search for details using importationId
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
        // For local products, transform using search service format
        // and get Importation price if available
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
        productData,
      };
    } catch (error) {
      this.logger.error(`Error transforming cart item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Get Importation product details from stored data
   * Uses stored data to avoid excessive API calls to Importation
   */
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
        // Standardized numeric prices from mtgsrc
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
   * Get local product details
   * Always uses the local product's own price — freshPricing from mtgsrc
   * is only for importation items and must NOT override local prices.
   */
  private async getLocalProductDetails(single: any): Promise<any> {
    if (!single) {
      this.logger.warn('getLocalProductDetails called with null/undefined single');
      return null;
    }

    try {
      // Transform to standard format using search service method
      const transformed = this.searchService.transformLocalProductToImportationFormat(single);

      if (!transformed) {
        this.logger.warn(`Failed to transform local product ${single.id}`);
        return null;
      }

      // Always use the local product's own price with condition discount applied
      const currentPrice = this.extractPriceFromProductData(single);
      const discountPercent = single.conditions?.discount || 0;
      const discountedPrice = Math.round(currentPrice * (1 - discountPercent / 100) * 100) / 100;

      transformed.finalPrice = discountedPrice;

      // Ensure fields are standard and clean
      const { img, owner: _owner, ...cleanTransformed } = transformed;

      // Price selection: for MTG singles, match frontend logic (importation vs local);
      // for other TCGs, always use the local price.
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
          : cleanTransformed.price_mxn_local || discountedPrice || 0;
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

  /**
   * Normalize language for comparison (same as in SearchService)
   */
  private normalizeLanguageForComparison(lang: string | undefined | null): string {
    if (!lang) return 'ENGLISH';
    const upperLang = lang.toUpperCase().trim();

    // Map language codes and names to normalized English names
    const languageMap: Record<string, string> = {
      EN: 'ENGLISH',
      ENGLISH: 'ENGLISH',
      INGLÉS: 'ENGLISH',
      INGLES: 'ENGLISH',
      ES: 'SPANISH',
      SPANISH: 'SPANISH',
      ESPAÑOL: 'SPANISH',
      ESPANOL: 'SPANISH',
      JP: 'JAPANESE',
      JA: 'JAPANESE',
      JAPANESE: 'JAPANESE',
      JAPONÉS: 'JAPANESE',
      JAPONES: 'JAPANESE',
      FR: 'FRENCH',
      FRENCH: 'FRENCH',
      FRANCÉS: 'FRENCH',
      FRANCES: 'FRENCH',
      DE: 'GERMAN',
      GERMAN: 'GERMAN',
      ALEMÁN: 'GERMAN',
      ALEMAN: 'GERMAN',
      IT: 'ITALIAN',
      ITALIAN: 'ITALIAN',
      ITALIANO: 'ITALIAN',
      PT: 'PORTUGUESE',
      PORTUGUESE: 'PORTUGUESE',
      PORTUGUÉS: 'PORTUGUESE',
      PORTUGUES: 'PORTUGUESE',
      ZH: 'CHINESE',
      CHINESE: 'CHINESE',
      CHINO: 'CHINESE',
      KO: 'KOREAN',
      KOREAN: 'KOREAN',
      COREANO: 'KOREAN',
      RU: 'RUSSIAN',
      RUSSIAN: 'RUSSIAN',
      RUSO: 'RUSSIAN',
    };

    return languageMap[upperLang] || 'ENGLISH';
  }

  /**
   * Extract minimal required data for cart persistence
   */
  private extractMinimalProductData(productData: Record<string, unknown>): Record<string, unknown> {
    const name = productData.cardName || productData.name || productData.title || '';
    const importationIdValue = productData.importationId || '';
    const language = productData.language || 'Inglés';
    const foil = productData.foil === true || productData.foil === 'true' || productData.foil === 1;

    // Standardized fields from the refactor
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
      // Carry over other useful fields if present
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
   * Transform local product to match frontend format
   */
  private transformLocalProduct(single: any) {
    if (!single) return null;

    return {
      id: single.id,
      title: single.name,
      cardName: single.cardName || single.name,
      price: `$${Number(single.finalPrice || single.price).toFixed(2)} MXN`,
      imageUrl: single.img,
      stock: single.stock,
      expansion: single.expansion,
      variant: single.variant,
      condition: single.conditions?.display_name || single.conditions?.name || 'Near Mint',
      language: single.languages?.display_name || single.languages?.name || 'Inglés',
      immediateDelivery: single.isLocalInventory,
      isLocalInventory: single.isLocalInventory,
      foil: single.foil,
      metadata: single.metadata || [],

      importationId: single.importationId,
      category: single.categories?.name || 'SINGLES',
    };
  }

  /**
   * Get cart summary with calculated totals
   * All price calculations are refreshed by getCart() and then summed here.
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

      // Trust the finalPrice provided by productData (refreshed from mtgsrc in getCart)
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

    // Calculate shipping cost
    let shipping = 0;
    if (shippingMethod === 'shipping') {
      const shippingSetting = await this.prisma.admin_settings.findUnique({
        where: { key: 'shippingCost' },
      });
      shipping = shippingSetting ? parseFloat(shippingSetting.value) : 280;
    }

    // Calculate total: Subtotal + Shipping (round to 2 decimals)
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
