import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SearchImportationDto } from './dto/search-importation.dto.js';
import { SearchImportationMTGDto } from './dto/search-importation-mtg.dto.js';
import { ImportationService, ImportationSearchResult } from '../importation/importation.service.js';
import { ProductsService } from '../products/products.service.js';
import { PrismaService } from '@hydra/database';
import { CurrencyService } from '../importation/currency.service.js';
import { IMPORTATION_SEARCH_LANG_MAP } from '../common/constants/importation.js';

export interface SearchFilters {
  conditions?: string[];
  languages?: string[];
  foil?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  expansions?: string[];
  tcgId?: string;
  skipEnrichment?: boolean;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly scryfallBaseUrl = 'https://api.scryfall.com';

  private normalizeStr(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private formatImportationQuery(query: string): string {
    return query
      .trim()
      .split(/\s*\/\/\s*/)[0]
      .split(/\s*\/\s*/)[0];
  }

  private getImportationLanguageCodes(languages?: string[]): string | undefined {
    if (!languages || languages.length === 0) return undefined;
    const codes = languages
      .map((l) => IMPORTATION_SEARCH_LANG_MAP[l.toLowerCase()])
      .filter(Boolean);
    return codes.length > 0 ? codes.join('|') : undefined;
  }

  constructor(
    private readonly importationService: ImportationService,
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService,
  ) {}

  /**
   * Search Importation API - Returns transformed data with MXN prices, language mapping, and metadata
   * Uses ImportationService for data transformation
   */
  async searchImportation(searchDto: SearchImportationDto, filters: SearchFilters = {}) {
    try {
      // Map our filter values to Importation API format where possible
      const languageCode = this.getImportationLanguageCodes(filters.languages);

      const result = await this.importationService.searchCards({
        query: searchDto.kw,
        page: searchDto.page || 1,
        rows: searchDto.rows,
        priceFilter: searchDto.priceFilter,
        language: languageCode,
        foil: filters.foil === true ? true : undefined,
        skipEnrichment: filters.skipEnrichment,
        includeOutOfStock: !filters.inStock,
      });

      if (!result.success) {
        throw new BadRequestException(
          result.message || 'Error communicating with importation service',
        );
      }

      // Further filter in-memory if multiple languages were selected or other filters not supported by API
      if (filters.languages && filters.languages.length > 0) {
        const normalizedFilters = filters.languages.map((l) =>
          this.normalizeLanguageForComparison(l),
        );
        result.data = result.data.filter((h) =>
          normalizedFilters.includes(this.normalizeLanguageForComparison(h.language)),
        );
      }

      if (filters.expansions && filters.expansions.length > 0) {
        result.data = result.data.filter((h) =>
          filters.expansions!.some((exp) => h.expansion.toLowerCase().includes(exp.toLowerCase())),
        );
      }

      if (filters.foil !== undefined) {
        result.data = result.data.filter((h) => h.foil === filters.foil);
      }

      if (filters.inStock) {
        result.data = result.data.filter((h) => h.stock > 0);
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        result.data = result.data.filter((h) => {
          const price = typeof h.finalPrice === 'number' ? h.finalPrice : 0;
          if (filters.minPrice !== undefined && price < filters.minPrice) return false;
          if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
          return true;
        });
      }

      // If we filtered in-memory, update the total items count (at least for this page/buffer)
      if (
        filters.languages ||
        filters.foil !== undefined ||
        filters.inStock ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined
      ) {
        if (
          result.pagination &&
          result.data.length < searchDto.rows! &&
          result.pagination.hasNextPage === false
        ) {
          result.pagination.totalItemsAllPages = result.data.length;
        }
      }

      return result;
    } catch (error) {
      this.logger.warn(
        `Error searching Importation API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException(
        `Failed to search Importation API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search Importation API - Pure Importation Data
   * Skips hybrid matching and focuses only on Importation source
   */
  async searchImportationMTG(searchDto: SearchImportationMTGDto, filters: SearchFilters = {}) {
    try {
      // Map our filter values to Importation API format where possible
      const languageCode = this.getImportationLanguageCodes(filters.languages);

      // Use the transformed search from ImportationService
      const result = await this.importationService.searchCards({
        query: searchDto.kw,
        page: searchDto.page || 1,
        rows: searchDto.rows || 60,
        priceFilter: searchDto.priceFilter,
        language: languageCode,
        foil: filters.foil === true ? true : undefined,
        skipEnrichment: true, // Bypass local DB enrichment for "pure" results
        includeOutOfStock: !filters.inStock,
      });

      // Further filter in-memory if multiple languages were selected or other filters not supported by API
      if (filters.languages && filters.languages.length > 0) {
        const normalizedFilters = filters.languages.map((l) =>
          this.normalizeLanguageForComparison(l),
        );
        result.data = result.data.filter((h) =>
          normalizedFilters.includes(this.normalizeLanguageForComparison(h.language)),
        );
      }

      if (filters.expansions && filters.expansions.length > 0) {
        result.data = result.data.filter((h) =>
          filters.expansions!.some((exp) => h.expansion.toLowerCase().includes(exp.toLowerCase())),
        );
      }

      if (filters.foil !== undefined) {
        result.data = result.data.filter((h) => h.foil === filters.foil);
      }

      if (filters.inStock) {
        result.data = result.data.filter((h) => h.stock > 0);
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        result.data = result.data.filter((h) => {
          const price = typeof h.finalPrice === 'number' ? h.finalPrice : 0;
          if (filters.minPrice !== undefined && price < filters.minPrice) return false;
          if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
          return true;
        });
      }

      // If we filtered in-memory, update the total items count (at least for this page/buffer)
      if (
        filters.languages ||
        filters.foil !== undefined ||
        filters.inStock ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined
      ) {
        if (
          result.pagination &&
          result.data.length < (searchDto.rows || 12) &&
          result.pagination.hasNextPage === false
        ) {
          result.pagination.totalItemsAllPages = result.data.length;
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Error searching importation:', error);
      throw new BadRequestException(
        `Failed to search importation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Autocomplete card names using Scryfall (primary) or hydra-mtgsrc (fallback)
   * Returns deduplicated card name suggestions
   */
  async autocomplete(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();

    // Try Scryfall first as it is much faster and better at partial matching
    try {
      const scryfallUrl = `${this.scryfallBaseUrl}/cards/autocomplete?q=${encodeURIComponent(trimmedQuery)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      let response: Response;
      try {
        response = await fetch(scryfallUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      if (response.ok) {
        const result = await response.json();
        if (result && Array.isArray(result.data)) {
          return result.data;
        }
      } else {
        this.logger.warn(`Scryfall autocomplete returned non-OK status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        `Error fetching autocomplete from Scryfall: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Continue to fallback
    }

    // Fallback to Importation catalogue
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Importation autocomplete timeout')), 5000),
      );
      const result = await Promise.race([
        this.importationService.searchCards({
          query: trimmedQuery,
          page: 1,
          rows: 20,
          skipEnrichment: true,
          includeOutOfStock: true,
        }),
        timeout,
      ]);

      const seen = new Set<string>();
      const names: string[] = [];
      for (const r of result.data || []) {
        const name = r.cardName;
        if (name && !seen.has(name.trim())) {
          seen.add(name.trim());
          names.push(name.trim());
          if (names.length >= 20) break;
        }
      }
      return names;
    } catch (error) {
      this.logger.error(
        `Error fetching autocomplete from mtgsrc: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Normalize language for comparison
   * Maps language codes and names to normalized English names
   */
  private normalizeLanguageForComparison(lang: string | undefined | null): string {
    return this.importationService.normalizeLanguageForComparison(lang);
  }

  /**
   * Transform local product to match Importation search result format
   */
  transformLocalProductToImportationFormat(localProduct: any): any {
    // Extract price values (handle Decimal types)
    const getNumericValue = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (
        typeof value === 'object' &&
        'toNumber' in value &&
        typeof (value as { toNumber?: () => unknown }).toNumber === 'function'
      ) {
        const numValue = (value as { toNumber: () => unknown }).toNumber();
        return typeof numValue === 'number' ? numValue : 0;
      }
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const productRecord = localProduct as Record<string, unknown>;
    const conditions = productRecord.conditions as { discount?: number } | null | undefined;
    const discountPercent = conditions?.discount || 0;

    // Extract stock count
    const productStock = productRecord.stock;
    const getNumericStock = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    const stockCount = getNumericStock(productStock);

    let priceFormatted: string;

    // Trust the stored price (already in MXN and including fees/taxes from mtgsrc sync)
    const finalPriceValue = Number(productRecord.price || 0);
    const priceValue = productRecord.price;
    const basePrice = getNumericValue(priceValue) || getNumericValue(finalPriceValue) || 0;
    priceFormatted = `$${basePrice.toFixed(2)} MXN`;

    // Calculate final price with condition discount
    const finalPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
    const originalPriceFormatted = discountPercent > 0 ? priceFormatted : undefined;
    if (discountPercent > 0) {
      priceFormatted = `$${finalPrice.toFixed(2)} MXN`;
    }

    // Extract category name
    const categories = productRecord.categories as
      | { name?: string; display_name?: string }
      | null
      | undefined;
    const getCategoryName = (cat: unknown): string | null => {
      if (cat && typeof cat === 'object') {
        if ('name' in cat && typeof cat.name === 'string') {
          return cat.name;
        }
        if ('display_name' in cat && typeof cat.display_name === 'string') {
          return cat.display_name;
        }
      }
      return null;
    };
    const categoryName = getCategoryName(categories) || 'SINGLES';

    // Extract condition name
    const conditionWithName = productRecord.conditions as
      | { name?: string; display_name?: string }
      | null
      | undefined;
    const getConditionName = (cond: unknown): string | null => {
      if (cond && typeof cond === 'object') {
        if ('display_name' in cond && typeof cond.display_name === 'string') {
          return cond.display_name;
        }
        if ('name' in cond && typeof cond.name === 'string') {
          return cond.name;
        }
      }
      return null;
    };
    const conditionName = getConditionName(conditionWithName) || 'Near Mint';

    // Extract language display name
    const languages = productRecord.languages as
      | { name?: string; display_name?: string }
      | null
      | undefined;

    // Extract tcg name
    const tcgs = productRecord.tcgs as { name?: string; display_name?: string } | null | undefined;
    const getLanguageName = (lang: unknown): string | null => {
      if (lang && typeof lang === 'object') {
        if ('display_name' in lang && typeof lang.display_name === 'string') {
          return lang.display_name;
        }
        if ('name' in lang && typeof lang.name === 'string') {
          return lang.name;
        }
      }
      return null;
    };
    const languageName = getLanguageName(languages) || 'Inglés';

    // Extract metadata from local product
    const metadata: string[] = [];
    const productMetadata = productRecord.metadata;
    if (productMetadata && Array.isArray(productMetadata)) {
      metadata.push(...productMetadata.filter((item): item is string => typeof item === 'string'));
    }
    const productFoil = productRecord.foil;
    if (productFoil === true) {
      if (!metadata.includes('Foil')) {
        metadata.push('Foil');
      }
    }

    // Extract boolean flags from metadata
    const productBorderless = productRecord.borderless;
    const productExtendedArt = productRecord.extendedArt;
    const productPrerelease = productRecord.prerelease;
    const productPremierPlay = productRecord.premierPlay;
    const productSurgeFoil = productRecord.surgeFoil;

    const borderless = metadata.includes('Borderless') || productBorderless === true;
    const extendedArt = metadata.includes('Extended Art') || productExtendedArt === true;
    const prerelease = metadata.includes('Prerelease') || productPrerelease === true;
    const premierPlay = metadata.includes('Premier Play') || productPremierPlay === true;
    const surgeFoil =
      metadata.includes('Surge Foil') ||
      metadata.includes('SurgeFoil') ||
      productSurgeFoil === true;

    // Build link if importationId exists
    const productLanguagesForLink = productRecord.languages as { code?: string } | null | undefined;
    const languageCode =
      (productLanguagesForLink &&
      typeof productLanguagesForLink === 'object' &&
      typeof productLanguagesForLink.code === 'string'
        ? productLanguagesForLink.code
        : null) || 'EN';
    const productImportationId = productRecord.importationId;
    const importationIdString =
      productImportationId &&
      (typeof productImportationId === 'string' || typeof productImportationId === 'number')
        ? String(productImportationId)
        : null;
    const link = importationIdString
      ? `https://www.importationmtg.com/en/products/detail/${importationIdString}?lang=${languageCode}`
      : '';

    // Determine if import badge should be shown
    // Show badge if:
    // 1. Product has importationId AND is local inventory AND has stock > 0, OR
    // 2. Explicitly set to true, OR
    // 3. Metadata includes "Personal"

    // Extract remaining properties from productRecord
    const productCardName = productRecord.cardName;
    const productCardNumber = productRecord.cardNumber;
    const productExpansion = productRecord.expansion;
    const productImg = productRecord.img;
    const productTags = productRecord.tags;

    const getStringValue = (value: unknown): string => {
      return typeof value === 'string' ? value : '';
    };

    const getCardName = (): string => {
      return getStringValue(productCardName);
    };

    // Extract product ID
    const productId = productRecord.id;
    const productIdString = productId && typeof productId === 'string' ? productId : null;

    // Return in Importation format
    console.log(
      `[transform] ${getCardName()} | importationId=${importationIdString ?? 'null'} | price=${basePrice} | price_mxn_local=${getNumericValue(productRecord.priceMxnLocal) || 'null'} | price_mxn_importation=${getNumericValue(productRecord.priceMxnImportation) || 'null'} | isLocal=${stockCount > 0 ? true : Boolean(productRecord.isLocalInventory)} | stock=${stockCount}`,
    );
    return {
      id: productIdString, // Local product ID (UUID)
      borderless,
      cardName: getCardName(),
      cardNumber: getStringValue(productCardNumber),
      category: categoryName,
      condition: conditionName,
      expansion: getStringValue(productExpansion) || '',
      extendedArt,
      finalPrice: finalPrice,
      foil: productFoil === true,
      importationId: importationIdString || null,
      img: getStringValue(productImg),
      isLocalInventory: stockCount > 0 ? true : Boolean(productRecord.isLocalInventory),
      language: languageName,
      link: link,
      metadata: metadata,
      prerelease,
      premierPlay,
      price: priceFormatted,
      originalPrice: originalPriceFormatted,
      basePriceMXN: finalPrice,
      importFeeMXN: getNumericValue(productRecord.importFeeMXN),
      price_mxn_local: getNumericValue(productRecord.priceMxnLocal) || undefined,
      price_mxn_importation: getNumericValue(productRecord.priceMxnImportation) || undefined,

      stock: stockCount,
      immediateDelivery: stockCount > 0,
      surgeFoil,
      tags: Array.isArray(productTags) ? productTags : [],
      variant: getStringValue(productExpansion) || null,
      tcgId: productRecord.tcg_id || productRecord.tcgId,
      tcg:
        tcgs?.name ||
        (productRecord.tcg_id === 'bd789d3f-5569-4971-890e-e261e145e42c' ? 'MAGIC' : 'OTHER'),
      soldBy:
        (productRecord.owner as any)?.is_hydra_alias === true
          ? 'Hydra'
          : (productRecord.owner as any)?.store_name || 'Hydra',
      storeLogo: (productRecord.owner as any)?.store_logo_url || null,
    };
  }

  /**
   * Sync prices from mtgsrc for raw Prisma product records in-place.
   * Mutates product.price so transformLocalProductToImportationFormat uses the fresh value.
   * Appends DB update entries to priceUpdates for background persistence.
   */
  private async syncPricesInPlace(
    products: any[],
    priceUpdates: Array<{
      id: string;
      price: number;
      priceMxnLocal: number;
      priceMxnImportation: number;
    }>,
  ): Promise<void> {
    const withId = products.filter((p) => p.importationId);
    if (!withId.length) return;
    try {
      const mappedProducts = withId.map((p) => ({
        id: p.id,
        importationId: p.importationId,
        is_foil: p.foil,
        language: p.languages?.code || p.languages?.name || p.language,
        name: p.cardName,
        isLocalInventory: p.stock > 0 || p.isLocalInventory === true,
      }));
      console.log(
        `[syncPrices] Requesting prices for ${mappedProducts.length} products:`,
        JSON.stringify(
          mappedProducts.map((p) => ({ importationId: p.importationId, name: p.name })),
        ),
      );
      const priceMap = await this.importationService.getPricesForSingles(mappedProducts);
      console.log(
        `[syncPrices] Got ${priceMap.size} results from mtgsrc:`,
        JSON.stringify(
          [...priceMap.entries()].map(([id, v]) => ({
            id,
            price: v.price,
            priceMxnLocal: v.priceMxnLocal,
            priceMxnImportation: v.priceMxnImportation,
            basePriceJPY: v.basePriceJPY,
          })),
        ),
      );

      for (const product of products) {
        const fresh = priceMap.get(product.id);
        const isLocal = product.stock > 0 || product.isLocalInventory === true;
        console.log(
          `[syncPrices] ${product.cardName || product.id} | stock=${product.stock} isLocalInventory=${product.isLocalInventory} → isLocal=${isLocal} | freshPrice=${fresh?.price ?? 'NOT_FOUND'} | priceMxnLocal=${fresh?.priceMxnLocal ?? 'N/A'} | priceMxnImportation=${fresh?.priceMxnImportation ?? 'N/A'} | basePriceJPY=${fresh?.basePriceJPY ?? 'N/A'} | prevPrice=${product.price}`,
        );

        if (fresh && fresh.price > 0) {
          product.price = fresh.price;
          product.basePriceJPY = 0;
          product.priceMxnLocal = fresh.priceMxnLocal;
          product.priceMxnImportation = fresh.priceMxnImportation;
          priceUpdates.push({
            id: product.id,
            price: fresh.price,
            priceMxnLocal: fresh.priceMxnLocal,
            priceMxnImportation: fresh.priceMxnImportation,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`[searchLocal] mtgsrc price sync failed: ${(err as Error).message}`);
    }
  }

  /**
   * Hybrid search: searches both Importation API and local database
   * Synchronizes prices when matches are found
   * Applies condition discounts to local products
   * Returns combined results with pagination
   */
  async searchHybrid(
    query: string,
    page: number = 1,
    limit: number = 12,
    filters: SearchFilters = {},
  ): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    localCount: number;
    importationCount: number;
    updatedPrices: number;
  }> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter (q) is required');
    }

    const searchQuery = query.trim();

    let importationResults: ImportationSearchResult[] = [];
    let importationPagination: {
      totalItems: number;
      totalItemsAllPages: number;
      currentPage: number;
      maxPage: number;
      hasNextPage: boolean;
      itemsPerPage: number;
    } | null = null;
    let localProducts: any[] = [];
    let updatedPricesCount = 0;

    // Search local database FIRST to know local product count for buffer sizing
    try {
      localProducts = await this.productsService.findByName(searchQuery, filters.tcgId, filters);
    } catch (error) {
      this.logger.error(
        `Failed to search local database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Buffer covers all local products for complete dedup + extra for pagination
    const importationRows = Math.max(localProducts.length * 2, limit * 3);

    // Search Importation API using rows parameter
    const MAGIC_TCG_ID = 'bd789d3f-5569-4971-890e-e261e145e42c';
    const isMagicOrGeneral = !filters.tcgId || filters.tcgId === MAGIC_TCG_ID;

    if (isMagicOrGeneral) {
      try {
        const importationResponse = await this.searchImportation(
          {
            kw: searchQuery,
            page: 1,
            rows: importationRows,
          },
          { ...filters, skipEnrichment: true },
        );
        importationResults = importationResponse.data || [];
        importationPagination = importationResponse.pagination || null;
      } catch (error) {
        this.logger.warn(
          `Failed to search Importation API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.logger.log(
      `Hybrid Search: Found ${importationResults.length} importation results and ${localProducts.length} local products for "${searchQuery}"`,
    );

    // 1. Process local products and match them with Importation for price updates
    const priceUpdates: Array<{ id: string; price: number; finalPrice: number }> = [];

    // Sync prices for all local products before matching so that the unmatched fallback
    // (transformLocalProductToImportationFormat) uses the correct local price formula
    // (base + profit, no import fee) for products with physical stock.
    const syncPriceUpdates: Array<{
      id: string;
      price: number;
      priceMxnLocal: number;
      priceMxnImportation: number;
    }> = [];
    await this.syncPricesInPlace(localProducts, syncPriceUpdates);

    let processedLocalProducts: any[] = [];
    try {
      processedLocalProducts = localProducts.map((lp) => {
        const match = importationResults.find((hr) => {
          // 1. Mandatory ID match (Must match exactly)
          if (!lp.importationId || hr.importationId !== lp.importationId) return false;

          // 2. Mandatory Language match
          const hrLanguage = this.normalizeLanguageForComparison(hr.language).toUpperCase().trim();
          const lpLanguageCode = lp.languages?.code || 'EN';
          const normalizedLpLanguage = this.normalizeLanguageForComparison(lpLanguageCode)
            .toUpperCase()
            .trim();
          if (hrLanguage !== normalizedLpLanguage) return false;

          // 3. Mandatory Foil match
          if ((hr.foil === true) !== (lp.foil === true)) return false;

          return true;
        });

        if (match && match.price_mxn_local !== undefined) {
          // Use pre-calculated price from mtgsrc (local match = price without tax)
          const baseFinalPrice = match.price_mxn_local;
          const baseMXN = match.basePriceMXN || baseFinalPrice;

          const discountPercent = lp.conditions?.discount || 0;
          const discountedFinal =
            Math.round(baseFinalPrice * (1 - discountPercent / 100) * 100) / 100;
          const originalPrice =
            discountPercent > 0 ? `$${baseFinalPrice.toFixed(2)} MXN` : undefined;

          lp.price = baseFinalPrice;
          priceUpdates.push({
            id: lp.id,
            price: baseMXN,
            finalPrice: discountedFinal,
          });
          updatedPricesCount++;

          const transformed = this.transformLocalProductToImportationFormat(lp);
          const isInStock = lp.stock > 0;

          return {
            ...transformed,
            finalPrice: discountedFinal,
            price: `$${discountedFinal.toFixed(2)} MXN`,
            originalPrice,
            basePriceJPY: match.basePriceJPY,
            basePriceMXN: baseMXN,
            importFeeMXN: 0, // No import fee for Entrega Inmediata
            immediateDelivery: isInStock,
            isLocalInventory: true,
            stock: lp.stock, // Always use local DB stock — Entrega Inmediata is physically in our hands
          };
        }
        return this.transformLocalProductToImportationFormat(lp);
      });
    } catch (err) {
      this.logger.error(`[CRITICAL] Error in matching loop: ${err.message}`, err.stack);
    }

    // 2. Perform price updates in background (don't wait for it if not critical)
    if (priceUpdates.length > 0) {
      const updatePromises = priceUpdates.map((u) =>
        (this.prisma as any).singles.update({
          where: { id: u.id },
          data: { price: u.price },
        }),
      );
      (this.prisma as any)
        .$transaction(updatePromises)
        .catch((e) => this.logger.error(`Batch price update failed: ${e.message}`));
    }

    // 3. Define the virtual combined sequence
    // localTotal is the number of local items that will occupy the first N slots
    // 3. Prepare Importation results, excluding those already in the local section
    // Use a composite key (ID + Foil + Language) to ensure we only exclude exact matches
    const localProductKeys = new Set<string>();
    processedLocalProducts.forEach((p) => {
      const lang = this.normalizeLanguageForComparison(p.language).toUpperCase().trim();
      const foil = p.foil === true;
      if (p.importationId) {
        localProductKeys.add(`id-${p.importationId}-${foil}-${lang}`);
      }
      const nameKey = `name-${(p.cardName || '').toLowerCase().trim()}-${foil}-${lang}`;
      localProductKeys.add(nameKey);
    });

    const uniqueImportationResults = importationResults.filter((hr) => {
      const hrFoil = hr.foil === true;
      const hrLang = this.normalizeLanguageForComparison(hr.language || 'Inglés')
        .toUpperCase()
        .trim();
      const idKey = hr.importationId ? `id-${hr.importationId}-${hrFoil}-${hrLang}` : null;
      const nameKey = `name-${hr.cardName.toLowerCase().trim()}-${hrFoil}-${hrLang}`;

      const isUnique =
        (idKey === null || !localProductKeys.has(idKey)) && !localProductKeys.has(nameKey);
      if (!isUnique) {
        this.logger.debug(
          `[DEBUG] Filtering out redundant importation item: ${hr.cardName} (${hr.importationId}) foil=${hrFoil} lang=${hrLang}`,
        );
      }
      return isUnique;
    });

    this.logger.log(`[DEBUG] Unique importation results: ${uniqueImportationResults.length}`);

    // 4. Combined sequence: Local Top + Unique Importation results
    const localTotal = processedLocalProducts.length;
    // For Importation total, we use the API count but subtract matches found in buffer to be as accurate as possible
    const importationTotal = Math.max(
      0,
      (importationPagination?.totalItemsAllPages || 0) -
        (importationResults.length - uniqueImportationResults.length),
    );

    const total = localTotal + importationTotal;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    let paginatedResults: any[] = [];

    if (startIndex < localTotal) {
      // Page starts with local products
      const localSlice = processedLocalProducts.slice(startIndex, Math.min(endIndex, localTotal));
      const neededFromImportation = limit - localSlice.length;

      if (neededFromImportation > 0) {
        // Fill the rest of the page with Importation results starting from index 0
        // We'll use the unique buffer we prepared
        const importationSlice = uniqueImportationResults.slice(0, neededFromImportation);
        paginatedResults = [...localSlice, ...importationSlice];
      } else {
        paginatedResults = localSlice;
      }
    } else {
      // Page is entirely Importation results
      // We need to shift the index because local products took the first slots
      const importationStartIndex = startIndex - localTotal;
      const importationEndIndex = endIndex - localTotal;

      // Check if we already have the required items in our unique buffer
      if (importationTotal === 0 || importationStartIndex >= importationTotal) {
        paginatedResults = [];
      } else if (importationEndIndex <= uniqueImportationResults.length) {
        paginatedResults = uniqueImportationResults.slice(
          importationStartIndex,
          importationEndIndex,
        );
      } else {
        const startPage = Math.floor(importationStartIndex / limit) + 1;
        const endPage = Math.floor((importationEndIndex - 1) / limit) + 1;

        try {
          const fetchAndFilter = async (targetPage: number) => {
            const res = await this.searchImportation(
              { kw: searchQuery, page: targetPage, rows: limit },
              { ...filters, skipEnrichment: true },
            );
            const fetchedItems = res.data || [];

            return fetchedItems.filter((hr) => {
              const hrFoil = hr.foil === true;
              const hrLang = this.normalizeLanguageForComparison(hr.language || 'Inglés')
                .toUpperCase()
                .trim();
              const idKey = hr.importationId ? `id-${hr.importationId}-${hrFoil}-${hrLang}` : null;
              const nameKey = `name-${hr.cardName.toLowerCase().trim()}-${hrFoil}-${hrLang}`;

              return (
                (idKey === null || !localProductKeys.has(idKey)) && !localProductKeys.has(nameKey)
              );
            });
          };

          if (startPage === endPage) {
            const filteredData = await fetchAndFilter(startPage);
            const relativeStart = importationStartIndex % limit;
            paginatedResults = filteredData.slice(relativeStart, relativeStart + limit);
          } else {
            const [filteredP1, filteredP2] = await Promise.all([
              fetchAndFilter(startPage),
              fetchAndFilter(endPage),
            ]);
            const relativeStart = importationStartIndex % limit;
            const fromP1 = filteredP1.slice(relativeStart);
            const fromP2 = filteredP2.slice(0, limit - fromP1.length);
            paginatedResults = [...fromP1, ...fromP2];
          }
        } catch (error) {
          this.logger.warn(`Pagination fetch failed: ${error.message}`);
          paginatedResults = [];
        }
      }
    }

    return {
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      localCount: localTotal,
      importationCount: importationTotal,
      updatedPrices: updatedPricesCount,
    };
  }

  /**
   * Local search: searches only local database
   * Applies condition discounts to local products
   * Returns results with optional pagination
   * If no query provided, returns latest added items
   * Pagination is only returned if enabled via query parameter
   */
  async searchLocal(
    query: string | null,
    page: number = 1,
    limit: number = 12,
    enablePagination: boolean = false,
    metadata?: string,
    category?: string,
    expansion?: string,
    tcgId?: string,
    filters: SearchFilters = {},
  ): Promise<{
    success: boolean;
    data: any[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    localCount: number;
  }> {
    const pageNum = page;
    const limitNum = limit;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be at least 1');
    }

    if (limitNum < 1) {
      throw new BadRequestException('Limit must be at least 1');
    }

    const priceUpdates: Array<{
      id: string;
      price: number;
      priceMxnLocal: number;
      priceMxnImportation: number;
    }> = [];
    let localProducts: any[] = [];
    let totalCount = 0;

    // If query is provided, search by name
    // Otherwise, get latest added items
    if (query && query.trim() !== '') {
      const searchQuery = query.trim();

      try {
        localProducts = await this.productsService.findByName(searchQuery, tcgId, filters);
        totalCount = localProducts.length;

        // Apply pagination only if enabled
        if (enablePagination) {
          const startIndex = (pageNum - 1) * limitNum;
          const endIndex = startIndex + limitNum;
          localProducts = localProducts.slice(startIndex, endIndex);
        } else {
          // If pagination is disabled, limit to the specified limit
          localProducts = localProducts.slice(0, limitNum);
        }
      } catch (error) {
        this.logger.error(
          `[SearchService] searchLocal - Error searching local database for query "${searchQuery}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          error.stack,
        );
        localProducts = [];
        totalCount = 0;
      }
    } else if (expansion && expansion.trim() !== '') {
      const expansionFilter = expansion.trim();

      try {
        // Search by expansion
        const where: any = {
          expansion: { contains: expansionFilter, mode: 'insensitive' },
          // Filter: Only show local inventory items that have stock > 0.
          OR: [
            { isLocalInventory: { not: true } },
            {
              AND: [
                { isLocalInventory: true },
                { importationId: { not: null } },
                { stock: { gt: 0 } },
              ],
            },
          ],
        };

        if (enablePagination) {
          totalCount = await (this.prisma as any).singles.count({ where });
          localProducts = await (this.prisma as any).singles.findMany({
            where,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            include: {
              categories: true,
              conditions: true,
              languages: true,
              tcgs: true,
              owner: { include: { roles: true } },
              tags: { include: { tags: true } },
            },
            orderBy: { created_at: 'desc' },
          });
        } else {
          localProducts = await (this.prisma as any).singles.findMany({
            where,
            take: limitNum,
            include: {
              categories: true,
              conditions: true,
              languages: true,
              tcgs: true,
              owner: { include: { roles: true } },
              tags: { include: { tags: true } },
            },
            orderBy: { created_at: 'desc' },
          });
          totalCount = localProducts.length;
        }

        // Post-processing for tags (transform tags from single_tags[] to tags[])
        localProducts = localProducts.map((p) => ({
          ...p,
          tags: p.tags?.map((st: any) => st.tags) || [],
        }));
      } catch (error) {
        this.logger.error(
          `Failed to search expansions in local database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        localProducts = [];
        totalCount = 0;
      }
    } else {
      // Get latest added items or filter by metadata
      if (metadata) {
        try {
          // Use the raw metadata string directly — the DB query uses mode:'insensitive'
          // so we don't need to normalize casing here. Normalizing was destroying cases
          // like 'cEDH Staple' → 'Cedh staple' which never matched any tags.
          const normalizedMetadata = metadata;

          if (enablePagination) {
            // Get total count first for pagination with tag filter
            totalCount = await (this.prisma as any).singles.count({
              where: {
                tags: {
                  some: {
                    tags: {
                      name: {
                        equals: normalizedMetadata,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                // Filter: Only show local inventory items that have stock > 0.
                OR: [
                  { isLocalInventory: { not: true } },
                  {
                    AND: [
                      { isLocalInventory: true },
                      { importationId: { not: null } },
                      { stock: { gt: 0 } },
                    ],
                  },
                ],
              },
            });
            // Get paginated results
            localProducts = await this.productsService.findByMetadata(
              metadata,
              limitNum,
              pageNum,
              tcgId,
            );
          } else {
            // If pagination is disabled, search iteratively until we have 4 valid products
            // (same behavior as category search without pagination)
            const TARGET_PRODUCTS = limitNum;
            const BATCH_SIZE = 12; // Search in batches of 12
            const validProducts: any[] = [];
            let currentPage = 1;
            const allFetchedProducts: any[] = [];

            // Keep searching until we have 4 valid products or run out of products
            while (validProducts.length < TARGET_PRODUCTS) {
              // Fetch a batch of products
              const batch = await this.productsService.findByMetadata(
                metadata,
                BATCH_SIZE,
                currentPage,
                tcgId,
              );

              if (batch.length === 0) {
                // No more products available
                break;
              }

              allFetchedProducts.push(...batch);

              // Filter this batch
              const productsWithoutImportationStock =
                await this.importationService.filterProductsWithoutImportationStock(batch);

              // Sync prices from mtgsrc before transforming
              await this.syncPricesInPlace(batch, priceUpdates);

              // Process and add valid products
              for (const localProduct of batch) {
                if (validProducts.length >= TARGET_PRODUCTS) {
                  break;
                }

                // Skip products without Importation stock if they have Personal tag
                const productId = localProduct.id;
                if (
                  productId &&
                  typeof productId === 'string' &&
                  productsWithoutImportationStock.has(productId)
                ) {
                  continue;
                }

                // Transform local product to match Importation format
                const transformedProduct = this.transformLocalProductToImportationFormat(
                  localProduct,
                ) as unknown;
                validProducts.push(transformedProduct);
              }

              // If we got less than BATCH_SIZE, we've reached the end
              if (batch.length < BATCH_SIZE) {
                break;
              }

              currentPage++;
            }

            // Store the valid products in localProducts for consistency
            localProducts = validProducts;
            totalCount = validProducts.length;
          }
        } catch (error) {
          this.logger.error(
            `Failed to get products with metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          localProducts = [];
          totalCount = 0;
        }
      } else {
        // If no category is specified, default to "singles" to match the behavior
        // when category=singles is explicitly provided
        const effectiveCategory = category || 'singles';

        try {
          if (enablePagination) {
            // Get total count first for pagination
            totalCount = await this.productsService.countByCategory(effectiveCategory, tcgId);
            localProducts = await this.productsService.findLatest(
              limitNum,
              pageNum,
              effectiveCategory,
              tcgId,
            );
            this.logger.log(
              `Found ${localProducts.length} latest local products (total: ${totalCount})`,
            );
          } else {
            // If pagination is disabled, search iteratively until we have 4 valid products
            const TARGET_PRODUCTS = limitNum;
            const BATCH_SIZE = 12; // Search in batches of 12
            const validProducts: any[] = [];
            let currentPage = 1;
            const allFetchedProducts: any[] = [];

            // Keep searching until we have 4 valid products or run out of products
            while (validProducts.length < TARGET_PRODUCTS) {
              const batch = await this.productsService.findLatest(
                BATCH_SIZE,
                currentPage,
                effectiveCategory,
                tcgId,
              );

              if (batch.length === 0) {
                // No more products available
                break;
              }

              allFetchedProducts.push(...batch);

              // Filter this batch
              const productsWithoutImportationStock =
                await this.importationService.filterProductsWithoutImportationStock(batch);

              // Sync prices from mtgsrc before transforming
              await this.syncPricesInPlace(batch, priceUpdates);

              // Process and add valid products
              for (const localProduct of batch) {
                if (validProducts.length >= TARGET_PRODUCTS) {
                  break;
                }

                // Skip products without Importation stock if they have Personal tag
                const productId = localProduct.id;
                if (
                  productId &&
                  typeof productId === 'string' &&
                  productsWithoutImportationStock.has(productId)
                ) {
                  continue;
                }

                // Transform local product to match Importation format
                const transformedProduct = this.transformLocalProductToImportationFormat(
                  localProduct,
                ) as unknown;
                validProducts.push(transformedProduct);
              }

              // If we got less than BATCH_SIZE, we've reached the end
              if (batch.length < BATCH_SIZE) {
                break;
              }

              currentPage++;
            }

            // Store the valid products in localProducts for consistency
            localProducts = validProducts;
            totalCount = validProducts.length;
            this.logger.log(
              `Found ${validProducts.length} valid products after filtering (searched ${allFetchedProducts.length} total products)`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to get latest products: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          localProducts = [];
          totalCount = 0;
        }
      }
    }

    // Process local products: transform to Importation format
    // For pagination mode, filter all products at once
    let processedLocalProducts: any[] = [];
    if (enablePagination) {
      // Sync prices from mtgsrc for paginated paths (raw records still in localProducts)
      await this.syncPricesInPlace(localProducts, priceUpdates);
      // Transform and filter products
      for (const localProduct of localProducts) {
        // Transform local product to match Importation format
        const transformedProduct = this.transformLocalProductToImportationFormat(
          localProduct,
        ) as unknown;
        processedLocalProducts.push(transformedProduct);
      }
    } else {
      // For non-pagination mode, products are already filtered and transformed above
      // (both for metadata and category searches, they go through the iterative filtering process)
      processedLocalProducts = localProducts;
    }

    // Build response
    const response: {
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      localCount: number;
    } = {
      success: true,
      data: processedLocalProducts,
      localCount: totalCount,
    };

    // Only include pagination if enabled
    if (enablePagination) {
      // For local-only searches, we just paginate the processed local products
      const total = totalCount || processedLocalProducts.length;
      const totalPages = Math.ceil(total / limitNum);

      // The products are already sliced/paginated in the search queries above,
      // but we ensure the response reflects the correct pagination metadata.
      response.data = processedLocalProducts;
      response.pagination = {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      };
    }

    // Persist fresh prices to DB in background (non-blocking)
    if (priceUpdates.length > 0) {
      (this.prisma as any)
        .$transaction(
          priceUpdates.map((u) =>
            (this.prisma as any).singles.update({
              where: { id: u.id },
              data: {
                price: u.price,
                priceMxnLocal: u.priceMxnLocal,
                priceMxnImportation: u.priceMxnImportation,
              },
            }),
          ),
        )
        .catch((e: Error) =>
          this.logger.error(`[searchLocal] Batch price update failed: ${e.message}`),
        );
    }

    return response;
  }
}
