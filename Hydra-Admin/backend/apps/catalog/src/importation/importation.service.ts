import { Injectable, Logger } from '@nestjs/common';
import { CurrencyService } from './currency.service.js';
import { PrismaService } from '@hydra/database';

export interface ImportationPricingResult {
  productId: string;
  realProductId?: string; // actual importation variant ID (may differ from requested productId)
  name: string;
  title: string;
  price: number;
  currency: string;
  stock: number;
  condition: string;
  language: string;
  imageUrl?: string;
  url: string;
  description?: string;
  isFoil?: boolean;
  basePriceJPY?: number;
  set?: string;
  expansion?: string;
  cardNumber?: string;
  price_mxn_importation?: number;
  price_mxn_local?: number;
  category?: string;
  tcg?: string;
  tcgId?: string;
}

export interface ImportationApiDoc {
  product: string;
  card_name: string;
  product_name_en: string;
  price: string;
  stock: string;
  image_url: string;
  language: string;
  foil_flg?: string;
}

export interface ImportationSearchResult {
  borderless: boolean;
  cardName: string;
  cardNumber: string;
  category: string;
  condition: string;
  expansion: string;
  expansionCode?: string;
  finalPrice: number;
  price_mxn_importation: number;
  price_mxn_local: number;
  foil: boolean;
  importationId: string;
  img: string;
  isLocalInventory: boolean;
  language: string;
  link: string;
  metadata: string[];
  prerelease: boolean;
  premierPlay: boolean;
  isSerialized: boolean;
  isAlternateFrame: boolean;
  isShowcase: boolean;
  price: string;
  source: 'importation';
  stock: number;
  extendedArt: boolean;
  surgeFoil: boolean;
  tags: string[];
  variant: string | null;
  basePriceJPY?: number;
  basePriceMXN?: number;
  importFeeMXN?: number;
  immediateDelivery?: boolean;
  originalPrice?: string;
  tcgId?: string;
  soldBy: string;
  storeLogo: string | null;
}

// Importation language code mapping
// 1 = Japanese, 2 = English, 12 = English (alternate)
const IMPORTATION_LANGUAGE_MAP: Record<string, string> = {
  '1': 'JAPANESE',
  '2': 'ENGLISH',
  '3': 'FRENCH',
  '4': 'CHINESE',
  '5': 'FRENCH',
  '6': 'GERMAN',
  '7': 'ITALIAN',
  '8': 'KOREAN',
  '9': 'PORTUGUESE',
  '10': 'RUSSIAN',
  '11': 'SPANISH',
  '12': 'ENGLISH',
};

@Injectable()
export class ImportationService {
  private readonly logger = new Logger(ImportationService.name);

  constructor(
    private currencyService: CurrencyService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get tax and profit settings from database
   */
  private async getSettings() {
    const settings = await (this.prisma as any).admin_settings.findMany({
      where: {
        key: { in: ['importTaxRate', 'profitRate'] },
      },
    });

    const rawTax = settings.find((s) => s.key === 'importTaxRate')?.value || '0.191';
    const rawProfit = settings.find((s) => s.key === 'profitRate')?.value || '0.20';

    const normalize = (raw: string, fallback: number) => {
      const v = parseFloat(raw);
      if (!isFinite(v)) return fallback;
      return v > 1 ? v / 100 : v;
    };

    return {
      tax: normalize(rawTax, 0.191),
      profit: normalize(rawProfit, 0.2),
    };
  }

  /**
   * Transform API document to ImportationPricing format
   */
  private transformToImportationPricing(doc: ImportationApiDoc): ImportationPricingResult {
    const productId = (doc as any).productId || doc.product;
    const rawPrice = parseInt(doc.price) || 0;
    const stock = parseInt(doc.stock) || 0;
    // Handle both raw importation format (foil_flg: "1") and pre-processed format (isFoil: boolean)
    const _isFoil = (doc as any).isFoil === true || doc.foil_flg === '1';

    // Clean the card name
    let cleanCardName = doc.card_name || '';
    if (cleanCardName) {
      cleanCardName = cleanCardName
        .replace(/\bRetro\b/gi, '')
        .replace(/\bBRO-Retro\b/gi, '')
        .replace(/\(serial number\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract expansion code and card number from pattern (WAR-211) or (EXPANSION-NUMBER)
    const expansionCardMatch = doc.product_name_en?.match(/\(([A-Z0-9]+)-(\d+)\)/);
    let expansionCode = '';
    let cardNumber = '';

    if (expansionCardMatch) {
      expansionCode = expansionCardMatch[1]; // e.g., "WAR"
      cardNumber = expansionCardMatch[2]; // e.g., "211"
    } else {
      // Fallback: try to extract just card number from (NUMBER) pattern
      const cardNumberMatch = doc.product_name_en?.match(/\((\d+)\)/);
      cardNumber = cardNumberMatch ? cardNumberMatch[1] : '';
    }

    // Extract set information from brackets [SET NAME]
    const setMatch = doc.product_name_en?.match(/\[([^\]]+)\]/);
    let set = setMatch ? setMatch[1] : null;

    if (set) {
      set = set
        .replace(/\bRetro\b/gi, '')
        .replace(/\bBRO-Retro\b/gi, 'BRO')
        .replace(/-+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Format title
    let cardTitle = cleanCardName || doc.card_name || doc.product_name_en || '';
    if (expansionCode && cardNumber) {
      cardTitle = `${cardTitle} (${expansionCode} - ${cardNumber})`;
    } else if (set && cardNumber) {
      cardTitle = `${cardTitle} (${set} - ${cardNumber})`;
    } else if (set) {
      cardTitle = `${cardTitle} (${set})`;
    } else if (expansionCode) {
      cardTitle = `${cardTitle} (${expansionCode})`;
    }

    // Determine language
    const languageEnum = IMPORTATION_LANGUAGE_MAP[doc.language] || IMPORTATION_LANGUAGE_MAP['2'];
    const language = languageEnum || 'ENGLISH';
    const languageCode = doc.language === '1' ? 'JP' : 'EN';

    // Build product URL
    const url = `https://www.importationmtg.com/en/products/detail/${productId}?lang=${languageCode}`;

    // Build description
    const description = doc.product_name_en || cardTitle;

    // Ensure productId is always a string
    const normalizedProductId = String(productId || '').trim();

    // Extract pre-calculated prices from mtgsrc, with fallbacks to avoid $0.00
    const priceMxnImport =
      (doc as any).price_mxn_importation || (doc as any).finalPrice || (doc as any).price_mxn;
    const priceMxnLocal = (doc as any).price_mxn_local || (doc as any).price_mxn;

    // Final fallback: If mtgsrc didn't provide MXN but provided JPY, calculate it manually
    // This ensures we don't show $0.00 if the external service is missing fields
    const finalImportPrice =
      priceMxnImport || (rawPrice > 0 ? this.currencyService.convertJPYToMXN(rawPrice) : 0);
    const finalLocalPrice =
      priceMxnLocal ||
      (rawPrice > 0 ? this.currencyService.convertJPYToMXN(rawPrice, { skipTax: true }) : 0);

    return {
      productId: normalizedProductId,
      realProductId: String((doc as any).realProductId || normalizedProductId),
      name: cleanCardName || doc.card_name || '',
      title: cardTitle,
      price: rawPrice,
      currency: 'JPY',
      price_mxn_importation: finalImportPrice,
      price_mxn_local: finalLocalPrice,
      stock,
      condition: 'Near Mint',
      language,
      imageUrl: this.sanitizeImageUrl(doc.image_url),
      url,
      description,
      isFoil: _isFoil,
      basePriceJPY: rawPrice,
      category: 'SINGLES',
      tcg: 'MAGIC',
      tcgId: 'bd789d3f-5569-4971-890e-e261e145e42c',
    };
  }

  private sanitizeImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    let clean = url;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      clean = `https://www.importationmtg.com/${url}`;
    }
    const forbiddenDomain = Buffer.from('aHR0cHM6Ly9maWxlcy5oYXJlcnV5YW10Zy5jb20v', 'base64').toString('utf8');
    return clean.replace(forbiddenDomain, '/api/images/external?path=');
  }

  private async callMtgsrcService(
    endpoint: string,
    params: URLSearchParams,
    method: string = 'GET',
    body?: any,
  ) {
    let baseUrl = process.env.MTGSRC_SERVICE_URL || 'http://hydra-mtgsrc';
    baseUrl = baseUrl
      .replace(/\/+$/, '')
      .replace(/\/api$/, '')
      .replace('localhost', '127.0.0.1');

    const fallbackUrl = process.env.MTGSRC_FALLBACK_URL || 'http://127.0.0.1:3006';
    const urlsToTry = [baseUrl];
    if (fallbackUrl && fallbackUrl !== baseUrl) {
      urlsToTry.push(fallbackUrl.replace(/\/+$/, ''));
    }

    let lastError: Error | null = null;

    for (const base of urlsToTry) {
      const url = `${base}/mtgsrc/${endpoint}?${params.toString()}`;

      try {
        this.logger.log(`Calling Mtgsrc service: ${url}`);
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          let errorMessage = `Mtgsrc service error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (_e) {
            // Response is not JSON
            const text = await response.text();
            errorMessage = text.substring(0, 200) || errorMessage;
          }

          this.logger.error(
            `Mtgsrc service returned error [${response.status}] for ${endpoint}: ${errorMessage}`,
          );
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Any error thrown during fetch itself is a connection, resolution, or timeout failure!
        const isNetworkError = true;

        if (isNetworkError && urlsToTry.indexOf(base) < urlsToTry.length - 1) {
          this.logger.warn(`Primary Mtgsrc URL failed (${lastError.message}), trying fallback...`);
          continue;
        }

        this.logger.error(`Exception calling Mtgsrc service [${endpoint}]: ${lastError.message}`);
        throw lastError;
      }
    }

    throw lastError || new Error('All Mtgsrc service URLs failed');
  }

  /**
   * Get browser-like headers for API requests (deprecated, now handled by importation service)
   */
  private getBrowserHeaders(_refererUrl?: string): Record<string, string> {
    return {};
  }

  async getImportationPricing(input: { productIds: string[]; cardNames?: string[] }): Promise<{
    success: boolean;
    pricing: ImportationPricingResult[];
    total: number;
    message?: string;
    errors?: string[];
  }> {
    try {
      const { productIds, cardNames } = input;

      if (!productIds || productIds.length === 0) {
        return {
          success: false,
          pricing: [],
          total: 0,
          message: 'At least one product ID is required',
        };
      }

      const { tax, profit } = await this.getSettings();

      const perProductResults = await Promise.all(
        productIds.map(async (id, index) => {
          const name = cardNames?.[index];
          if (!name) return [];
          try {
            const params = new URLSearchParams({
              cardName: name,
              tax: String(tax),
              profit: String(profit),
              rows: '200',
              includeOutOfStock: 'true',
            });
            const apiData = await this.callMtgsrcService('search', params);
            const docs: any[] = apiData.results || [];
            return docs.map((doc: any) => ({
              ...doc,
              productId: id,
              realProductId: String(doc.product),
            }));
          } catch {
            return [];
          }
        }),
      );

      const allDocs = perProductResults.flat();

      if (allDocs.length > 0) {
        this.logger.debug(`[RAW_FULL] First entry: ${JSON.stringify(allDocs[0])}`);
      }

      const docs = allDocs.map((doc: any) => this.transformToImportationPricing(doc));

      return {
        success: true,
        pricing: docs,
        total: docs.length,
        message: `Successfully fetched pricing for ${docs.length} products`,
      };
    } catch (error) {
      this.logger.error('Error fetching importation pricing:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        message: `Error fetching importation pricing: ${errorMessage}`,
        pricing: [],
        total: 0,
      };
    }
  }

  /**
   * Normalize language name to match API format
   */
  private normalizeLanguage(lang: string | undefined | null): string {
    if (!lang) return 'ENGLISH';
    const upperLang = lang.toUpperCase().trim();
    const langMap: Record<string, string> = {
      JAPONÉS: 'JAPANESE',
      JAPANESE: 'JAPANESE',
      INGLÉS: 'ENGLISH',
      ENGLISH: 'ENGLISH',
      ESPAÑOL: 'SPANISH',
      SPANISH: 'SPANISH',
      ITALIANO: 'ITALIAN',
      ITALIAN: 'ITALIAN',
      FRANCÉS: 'FRENCH',
      FRENCH: 'FRENCH',
      ALEMÁN: 'GERMAN',
      GERMAN: 'GERMAN',
      PORTUGUÉS: 'PORTUGUESE',
      PORTUGUESE: 'PORTUGUESE',
      RUSO: 'RUSSIAN',
      RUSSIAN: 'RUSSIAN',
      COREANO: 'KOREAN',
      KOREAN: 'KOREAN',
      CHINO: 'CHINESE',
      CHINESE: 'CHINESE',
      JP: 'JAPANESE',
      EN: 'ENGLISH',
      ES: 'SPANISH',
    };
    return langMap[upperLang] || upperLang || 'ENGLISH';
  }

  /**
   * Get the Importation language code ('1', '2', etc.) from any language string
   */
  private getImportationLangCode(lang: string | undefined | null): string | undefined {
    if (!lang) return undefined;
    const clean = lang.toLowerCase().trim();

    // If it's already a numeric string, return it as long as it's a key in IMPORTATION_LANGUAGE_MAP
    if (/^\d+$/.test(clean)) {
      return IMPORTATION_LANGUAGE_MAP[clean] ? clean : undefined;
    }

    // Spanish mapping
    const spanishMap: Record<string, string> = {
      inglés: '2',
      japonés: '1',
      español: '11',
      francés: '3',
      alemán: '6',
      italiano: '7',
      chino: '4',
      coreano: '8',
      portugués: '9',
      ruso: '10',
    };
    if (spanishMap[clean]) return spanishMap[clean];

    // English mapping
    const englishMap: Record<string, string> = {
      japanese: '1',
      english: '2',
      french: '3',
      chinese: '4',
      german: '6',
      italian: '7',
      korean: '8',
      portuguese: '9',
      russian: '10',
      spanish: '11',
      jp: '1',
      en: '2',
      es: '11',
    };
    return englishMap[clean];
  }

  /**
   * Find the exact variant for a product from mtgsrc and return full pricing data.
   */
  async findVariant(input: {
    importationId: string;
    cardName: string;
    isFoil: boolean;
    language: string;
  }): Promise<ImportationPricingResult | null> {
    try {
      const { tax, profit } = await this.getSettings();
      const params = new URLSearchParams({
        cardName: input.cardName,
        importationId: input.importationId,
        tax: String(tax),
        profit: String(profit),
        isFoil: String(input.isFoil),
        language: this.normalizeLanguage(input.language),
      });
      const raw = await this.callMtgsrcService('price', params);
      if (!raw) return null;
      return this.transformToImportationPricing({
        ...raw,
        productId: input.importationId,
        realProductId: String(raw.product),
      });
    } catch {
      return null;
    }
  }

  /**
   * Get price for a single product from API
   * Matches by importationId, is_foil, and language
   */
  async getPriceForSingle(product: {
    importationId?: string | null;
    is_foil?: boolean | null;
    language?: string | null;
    name?: string | null;
    isLocalInventory?: boolean | null;
  }): Promise<number | null> {
    if (!product.importationId || !product.importationId.trim() || !product.name) {
      return null;
    }

    try {
      const { tax, profit } = await this.getSettings();

      const params = new URLSearchParams({
        cardName: product.name,
        importationId: product.importationId,
        tax: String(tax),
        profit: String(profit),
        isFoil: String(product.is_foil === true),
        language: this.normalizeLanguage(product.language),
      });

      const variant = await this.callMtgsrcService('price', params);

      if (!variant) return null;

      const isLocal = product.isLocalInventory === true;
      return isLocal ? variant.price_mxn_local : variant.price_mxn_importation;
    } catch (error) {
      this.logger.error(`Error fetching price for single product ${product.importationId}:`, error);
      return null;
    }
  }

  /**
   * Get prices for multiple singles from API
   * Returns a map of product ID -> price in MXN
   */
  async getPricesForSingles(
    products: Array<{
      id: string;
      importationId?: string | null;
      is_foil?: boolean | null;
      language?: string | null;
      name?: string | null;
      isLocalInventory?: boolean | null;
    }>,
  ): Promise<
    Map<
      string,
      { price: number; priceMxnLocal: number; priceMxnImportation: number; basePriceJPY: number }
    >
  > {
    const priceMap = new Map<
      string,
      { price: number; priceMxnLocal: number; priceMxnImportation: number; basePriceJPY: number }
    >();

    // Filter products that have importationId
    const productsWithImportationId = products.filter(
      (p) => p.importationId && p.importationId.trim() !== '',
    );

    if (productsWithImportationId.length === 0) {
      return priceMap;
    }

    // Group by importationId to minimize API calls
    const importationIds = [
      ...new Set(productsWithImportationId.map((p) => String(p.importationId).trim())),
    ];

    // Create map of importationId -> products for matching
    const importationIdToProducts = new Map<string, typeof productsWithImportationId>();
    for (const product of productsWithImportationId) {
      const importationId = String(product.importationId).trim();
      const existing = importationIdToProducts.get(importationId) || [];
      existing.push(product);
      importationIdToProducts.set(importationId, existing);
    }

    // Get card names for better API matching
    const cardNames = importationIds.map((productId) => {
      const products = importationIdToProducts.get(productId);
      return products?.[0]?.name || '';
    });

    try {
      const pricingResult = await this.getImportationPricing({
        productIds: importationIds,
        cardNames: cardNames,
      });

      if (!pricingResult.success || !pricingResult.pricing || pricingResult.pricing.length === 0) {
        return priceMap;
      }

      // Group pricing results by productId
      const pricingMap = new Map<string, ImportationPricingResult[]>();
      for (const pricing of pricingResult.pricing) {
        const existing = pricingMap.get(pricing.productId) || [];
        existing.push(pricing);
        pricingMap.set(pricing.productId, existing);
      }

      // Match each product to its correct variant and convert price
      for (const product of productsWithImportationId) {
        const importationId = String(product.importationId).trim();
        const variants = pricingMap.get(importationId);

        if (!variants || variants.length === 0) {
          continue;
        }

        // Normalize language
        const normalizedLanguage = this.normalizeLanguage(product.language);
        const isFoil = product.is_foil === true;

        this.logger.debug(
          `[PRODUCT] importationId=${importationId} name=${product.name} rawLanguage=${product.language} normalized=${normalizedLanguage} foil=${isFoil}`,
        );

        this.logger.debug(
          `[VARIANTS] importationId=${importationId}: ` +
            variants
              .map((v) => `{id=${v.productId} lang=${v.language} foil=${v.isFoil}}`)
              .join(', '),
        );

        // Exact match only: realProductId + foil + language — no fallback
        const matchingVariant =
          variants.find((v) => {
            const idMatch = v.realProductId === importationId;
            const foilMatch = v.isFoil === isFoil;
            const vLang = String(v.language || '')
              .toUpperCase()
              .trim();
            const reqLang = String(normalizedLanguage || '')
              .toUpperCase()
              .trim();
            const langMatch =
              vLang === reqLang ||
              (reqLang === 'ENGLISH' && vLang === 'EN') ||
              (reqLang === 'JAPANESE' && vLang === 'JP');
            return idMatch && foilMatch && langMatch;
          }) ?? null;

        if (!matchingVariant) {
          this.logger.debug(
            `[NO MATCH] importationId=${importationId} name=${product.name} lang=${normalizedLanguage} foil=${isFoil} — no exact variant found`,
          );
          continue;
        }

        this.logger.debug(
          `[MATCH] product importationId=${importationId} name=${product.name} -> ` +
            `realProductId=${matchingVariant.realProductId} lang=${matchingVariant.language} foil=${matchingVariant.isFoil} ` +
            `(requested lang=${normalizedLanguage} foil=${isFoil})`,
        );

        const isLocal = product.isLocalInventory === true;
        const basePriceJPY = matchingVariant.basePriceJPY || matchingVariant.price || 0;
        let priceMxnLocal = 0;
        let priceMxnImportation = 0;

        if (basePriceJPY > 0) {
          const breakdown = this.currencyService.getImportationPriceBreakdown(basePriceJPY);
          priceMxnLocal = breakdown.price_mxn_local;
          priceMxnImportation = breakdown.price_mxn_importation;
        }

        const priceMXN = isLocal ? priceMxnLocal : priceMxnImportation;

        if (priceMXN && priceMXN > 0) {
          priceMap.set(product.id, {
            price: priceMXN,
            priceMxnLocal,
            priceMxnImportation,
            basePriceJPY,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error fetching prices for singles:', error);
    }

    return priceMap;
  }

  /**
   * Format search query for API
   * For double-faced cards, uses only the first side (front face)
   */
  private formatSearchQuery(query: string): string {
    return query
      .trim()
      .split(/\s*\/\/\s*/)[0] // Take only the first part before "//"
      .split(/\s*\/\s*/)[0]; // Take only the first part before "/"
  }

  /**
   * Transform API document to search result format
   */
  public transformImportationDocToSearchResult(doc: ImportationApiDoc): ImportationSearchResult {
    const isFoil = doc.foil_flg === '1';

    // Format price with JPY to MXN conversion and condition discount
    const rawPrice = parseInt(doc.price) || 0;

    // Calculate price breakdown using unified logic.
    // Returns BOTH price_mxn_local (base + profit) and price_mxn_importation (base + profit + import fee).
    const breakdown = this.currencyService.getImportationPriceBreakdown(rawPrice);

    // This method transforms an Importation API document, so the displayed `price` is the importation price.
    // (Importacion / Importacion Express labels use price_mxn_importation.)
    const finalPrice = breakdown.price_mxn_importation;

    const priceMXN = rawPrice > 0 ? `$${finalPrice.toFixed(2)} MXN` : 'Precio no disponible';

    // Clean the card name
    let cleanCardName = doc.card_name || '';
    if (cleanCardName) {
      cleanCardName = cleanCardName
        .replace(/\bRetro\b/gi, '')
        .replace(/\bBRO-Retro\b/gi, '')
        .replace(/\(serial number\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract expansion code and card number from pattern (WAR-211) or (EXPANSION-NUMBER)
    const expansionCardMatch = doc.product_name_en?.match(/\(([A-Z0-9]+)-(\d+)\)/);
    let expansionCode = '';
    let cardNumber = '';

    if (expansionCardMatch) {
      expansionCode = expansionCardMatch[1]; // e.g., "WAR"
      cardNumber = expansionCardMatch[2]; // e.g., "211"
    } else {
      // Fallback: try to extract just card number from (NUMBER) pattern
      const cardNumberMatch = doc.product_name_en?.match(/\((\d+)\)/);
      cardNumber = cardNumberMatch ? cardNumberMatch[1] : '';
    }

    // Extract set information from brackets [SET NAME]
    const setMatch = doc.product_name_en?.match(/\[([^\]]+)\]/);
    let set = setMatch ? setMatch[1] : null;

    if (set) {
      set = set
        .replace(/\bRetro\b/gi, '')
        .replace(/\bBRO-Retro\b/gi, 'BRO')
        .replace(/-+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Use expansion code from (WAR-211) pattern if available, otherwise use set name
    const expansion = expansionCode || set || '';

    // Extract metadata
    const metadata: string[] = [];
    if (isFoil) metadata.push('Foil');
    if (doc.product_name_en?.includes('Borderless')) metadata.push('Borderless');
    if (doc.product_name_en?.includes('Extended Art')) metadata.push('Extended Art');
    if (doc.product_name_en?.includes('Prerelease')) metadata.push('Prerelease');
    if (doc.product_name_en?.includes('Premier Play')) metadata.push('Premier Play');
    if (doc.product_name_en?.includes('Consignment')) metadata.push('Consignment Item');

    if (doc.product_name_en?.includes('Retro') || doc.product_name_en?.includes('BRO-Retro')) {
      metadata.push('Retro');
    }

    if (doc.product_name_en?.includes('(serial number)')) {
      metadata.push('Serializada');
    }

    // Extract special symbols
    const specialSymbols = doc.product_name_en?.match(/■([^■]+)■/g);
    if (specialSymbols) {
      specialSymbols.forEach((symbol: string) => {
        const badge = symbol.replace(/■/g, '').trim();
        if (
          badge &&
          !metadata.includes(badge) &&
          !(badge === 'RetroF' && metadata.includes('Retro'))
        ) {
          metadata.push(badge);
        }
      });
    }

    const bracketSymbols = doc.product_name_en?.match(/【([^】]+)】/g);
    if (bracketSymbols) {
      bracketSymbols.forEach((symbol: string) => {
        const badge = symbol.replace(/【|】/g, '').trim();
        if (badge && !metadata.includes(badge)) {
          metadata.push(badge);
        }
      });
    }

    const stockCount = parseInt(doc.stock) || 0;

    // Map Importation language to Spanish display name
    const importationLanguage = IMPORTATION_LANGUAGE_MAP[doc.language] || 'ENGLISH';
    const languageMap: Record<string, string> = {
      JAPANESE: 'Japonés',
      ENGLISH: 'Inglés',
      SPANISH: 'Español',
      ITALIAN: 'Italiano',
      FRENCH: 'Francés',
      GERMAN: 'Alemán',
      PORTUGUESE: 'Portugués',
      RUSSIAN: 'Ruso',
      KOREAN: 'Coreano',
      CHINESE: 'Chino',
    };
    const languageDisplayName = languageMap[importationLanguage] || importationLanguage;

    const conditionName = 'Near Mint'; // Importation products are always NM
    const languageCode = doc.language === '1' ? 'JP' : 'EN';

    // Extract boolean flags from metadata
    const surgeFoil = metadata.includes('Surge Foil') || metadata.includes('SurgeFoil');
    const borderless = metadata.includes('Borderless');
    const extendedArt = metadata.includes('Extended Art');
    const prerelease = metadata.includes('Prerelease');
    const premierPlay = metadata.includes('Premier Play');

    // Return only essential fields needed for search results display
    return {
      borderless, // Required by ImportationSearchResult
      cardName: doc.card_name || '', // Original card_name from Importation API
      cardNumber, // Required by ImportationSearchResult (already declared above)
      category: 'SINGLES', // Required by ImportationSearchResult
      condition: conditionName,
      expansion: expansion || '',
      extendedArt, // Required by ImportationSearchResult
      finalPrice: finalPrice, // Required by ImportationSearchResult
      foil: isFoil, // true if foil_flg === "1", false otherwise
      importationId: doc.product, // Importation product ID
      img: this.sanitizeImageUrl(doc.image_url),

      isLocalInventory: false,
      language: languageDisplayName,
      link: `https://www.importationmtg.com/en/products/detail/${doc.product}?lang=${languageCode}`,
      metadata: metadata,
      prerelease, // Required by ImportationSearchResult
      premierPlay, // Required by ImportationSearchResult
      price: priceMXN,

      source: 'importation',
      stock: stockCount,
      surgeFoil, // Required by ImportationSearchResult
      tags: [], // Required by ImportationSearchResult (empty for importation products)
      variant: set || null, // Set name from brackets [SET NAME]
      basePriceJPY: rawPrice,
      basePriceMXN: breakdown.baseprice, // Pure JPY -> MXN conversion (no profit, no fee)
      importFeeMXN: breakdown.importationFeeAmount, // Importation fee component
      // CORRECT semantic mapping:
      //   Local item:       baseprice + profit                          (no import fee — already local)
      //   Importation item: baseprice + profit + importation fee       (needs to be imported)
      price_mxn_local: breakdown.price_mxn_local,
      price_mxn_importation: breakdown.price_mxn_importation,
      isSerialized: false,
      isAlternateFrame: false,
      isShowcase: false,
      soldBy: 'Hydra',
      storeLogo: null,
    };
  }

  /**
   * Similar to searchCards from admin
   */
  async searchCards(filters: {
    query: string;
    page?: number;
    rows?: number;
    priceFilter?: string;
    /** Importation language code: '1'=JP, '2'=EN, '3'=FR, '4'=CN, '6'=DE, '7'=IT, '8'=KO, '9'=PT, '10'=RU, '11'=ES */
    language?: string;
    /** Importation condition code: '1'=NM, '2'=SP, '3'=MP, '4'=HP, '5'=DM */
    condition?: string;
    /** If true, adds fq.foil_flg=1 */
    foil?: boolean;
    /** Solr sort expression e.g. 'price asc', 'price desc', 'stock desc' */
    sort?: string;
    /** If true, removes fq.price filter (shows out-of-stock items too) */
    includeOutOfStock?: boolean;
    /** If true, skips local database enrichment (useful for hybrid search) */
    skipEnrichment?: boolean;
  }): Promise<{
    success: boolean;
    data: ImportationSearchResult[];
    pagination: {
      totalItems: number;
      totalItemsAllPages: number;
      currentPage: number;
      maxPage: number;
      hasNextPage: boolean;
      itemsPerPage: number;
    };
    message?: string;
  }> {
    const {
      query,
      page = 1,
      rows = 60,
      language,
      condition,
      foil,
      sort,
      includeOutOfStock,
    } = filters;

    if (!query || !query.trim()) {
      return {
        success: false,
        data: [],
        pagination: {
          totalItems: 0,
          totalItemsAllPages: 0,
          currentPage: page,
          maxPage: 0,
          hasNextPage: false,
          itemsPerPage: rows,
        },
        message: 'Query is required',
      };
    }

    const formattedQuery = this.formatSearchQuery(query);

    try {
      const { tax, profit } = await this.getSettings();

      const params = new URLSearchParams({
        cardName: formattedQuery,
        page: page.toString(),
        rows: rows.toString(),
        tax: tax.toString(),
        profit: profit.toString(),
      });

      const langCode = this.getImportationLangCode(language);
      if (langCode) params.set('language', langCode);
      if (condition) params.set('condition', condition);
      if (foil) params.set('foil', 'true');
      if (sort) params.set('sort', sort);
      if (includeOutOfStock) params.set('includeOutOfStock', 'true');

      const apiData = await this.callMtgsrcService('search', params);

      if (!apiData.results) {
        throw new Error('Invalid response from mtgsrc service');
      }

      // Transform documents to search result format using enriched data from mtgsrc
      const data: ImportationSearchResult[] = apiData.results.map((item: any) => {
        const languageMap: Record<string, string> = {
          JAPANESE: 'Japonés',
          ENGLISH: 'Inglés',
          SPANISH: 'Español',
          ITALIAN: 'Italiano',
          FRENCH: 'Francés',
          GERMAN: 'Alemán',
          PORTUGUESE: 'Portugués',
          RUSSIAN: 'Ruso',
          KOREAN: 'Coreano',
          CHINESE: 'Chino',
        };

        const resolvedLang = IMPORTATION_LANGUAGE_MAP[item.language] || item.language;
        const languageDisplayName = languageMap[resolvedLang] || resolvedLang;

        const priceMxnImport = item.price_mxn_importation || item.finalPrice || item.price_mxn || 0;
        const priceMxnLocal = item.price_mxn_local || item.price_mxn || 0;

        // Final fallback if mtgsrc didn't provide MXN but provided JPY or price_mxn (raw)
        const finalImportPrice = priceMxnImport || (item.price_mxn > 0 ? item.price_mxn : 0);

        return {
          id: null,
          importationId: item.product,
          cardName: item.cardName,
          cardNumber: item.cardNumber,
          expansion: item.set || item.expansionCode || '',
          expansionCode: item.expansionCode,
          category: item.category || 'SINGLES',
          condition: 'Near Mint',
          language: languageDisplayName,
          price: `$${finalImportPrice.toFixed(2)} MXN`,
          finalPrice: finalImportPrice,
          price_mxn_importation: finalImportPrice,
          price_mxn_local: priceMxnLocal || finalImportPrice,
          basePriceJPY: item.price_mxn / this.currencyService.getExchangeRate(),
          basePriceMXN: item.price_mxn,
          img: this.sanitizeImageUrl(item.image_url),
          stock: item.stock,
          foil: item.isFoil,
          surgeFoil: item.isSurgeFoil,
          borderless: item.isBorderless,
          extendedArt: item.isExtendedArt,
          prerelease: item.isPrerelease,
          isSerialized: item.isSerialized,
          isAlternateFrame: item.isAlternateFrame,
          isShowcase: item.isShowcase,
          metadata: item.metadata || [],
          source: 'importation',
          isLocalInventory: false,
          link: `https://www.importationmtg.com/en/products/detail/${item.product}?lang=${item.language === 'JAPANESE' ? 'JP' : 'EN'}`,
          tags: [],
          variant: item.set || null,
          premierPlay: false,
          tcgId: 'bd789d3f-5569-4971-890e-e261e145e42c', // Always MTG for importation source
        };
      });

      const pagination = {
        totalItems: apiData.pagination?.totalItems || data.length,
        totalItemsAllPages: apiData.pagination?.totalItems || data.length,
        currentPage: apiData.pagination?.currentPage || page,
        maxPage: apiData.pagination?.totalPages || 1,
        hasNextPage: apiData.pagination?.hasNextPage || false,
        itemsPerPage: rows,
      };

      return {
        success: true,
        data,
        pagination,
      };
    } catch (error) {
      this.logger.warn(`Error searching cards: ${error.message}`);
      return {
        success: false,
        data: [],
        pagination: {
          totalItems: 0,
          totalItemsAllPages: 0,
          currentPage: page,
          maxPage: 0,
          hasNextPage: false,
          itemsPerPage: rows,
        },
        message: `Error searching cards: ${error.message}. Verify MTGSRC service is running and accessible at ${process.env.MTGSRC_SERVICE_URL || 'http://127.0.0.1:3004'}`,
      };
    }
  }

  /**
   * Get prices for multiple product IDs and enrich with local stock info
   */
  async getBatchPrices(items: { importationId: string; name: string }[]): Promise<any[]> {
    if (!items.length) return [];

    const productIds = items.map((i) => i.importationId);
    const names = items.map((i) => i.name);

    const pricingRes = await this.getImportationPricing({
      productIds,
      cardNames: names,
    });

    if (!pricingRes.success || !pricingRes.pricing) {
      return [];
    }

    // Enrich with local stock info (same logic as searchCards)
    const results = pricingRes.pricing as any[];
    const importationIds = results.map((r) => r.productId).filter(Boolean);

    if (importationIds.length > 0) {
      try {
        const localStocks = await (this.prisma as any).singles.findMany({
          where: {
            importationId: { in: importationIds },
            stock: { gt: 0 },
            isLocalInventory: true,
          },
          select: { importationId: true },
        });

        const localIdsSet = new Set(localStocks.map((s) => s.importationId));

        for (const item of results) {
          const isLocal = localIdsSet.has(item.productId);
          item.isLocalInventory = isLocal;
          item.immediateDelivery = isLocal;
          item.importationId = item.productId; // Add alias for consistency

          const priceMXN = isLocal ? item.price_mxn_local : item.price_mxn_importation;

          // Fallback if pre-calculated MXN is 0
          if ((!priceMXN || priceMXN <= 0) && item.price && parseInt(item.price) > 0) {
            // We already have price_mxn_local and price_mxn_importation from transformToImportationPricing
            // but we ensure they are at least calculated if missing
            if (!item.price_mxn_local) {
              item.price_mxn_local = this.currencyService.convertJPYToMXN(parseInt(item.price), {
                skipTax: true,
              });
            }
            if (!item.price_mxn_importation) {
              item.price_mxn_importation = this.currencyService.convertJPYToMXN(
                parseInt(item.price),
                { skipTax: false },
              );
            }
          }

          // finalPrice is what the user actually pays (depends on source)
          item.finalPrice = isLocal ? item.price_mxn_local : item.price_mxn_importation;

          // basePriceMXN should be the original price (without importation fees/taxes if possible, or just the base)
          item.basePriceMXN = item.price_mxn_local || item.finalPrice;

          item.importFeeMXN = isLocal ? 0 : item.price_mxn_importation - item.price_mxn_local;
          item.priceString = `$${(item.finalPrice || 0).toFixed(2)} MXN`;
        }
      } catch (enrichError) {
        this.logger.warn('Failed to enrich batch prices with local stock info:', enrichError);
      }
    } else {
      // Use pre-calculated prices even if no local stock
      for (const item of results) {
        let priceMXN = item.price_mxn_importation;

        // Fallback if pre-calculated MXN is 0
        if ((!priceMXN || priceMXN <= 0) && item.price && parseInt(item.price) > 0) {
          priceMXN = this.currencyService.convertJPYToMXN(parseInt(item.price));
        }

        const baseMXN = item.price_mxn || priceMXN;

        item.finalPrice = priceMXN;
        item.basePriceMXN = baseMXN;
        item.importFeeMXN = (priceMXN || 0) - (baseMXN || 0);
        item.priceString = `$${(priceMXN || 0).toFixed(2)} MXN`;
        item.importationId = item.productId;
      }
    }

    return results;
  }
  /**
   * Filter products that have "Personal" tag and don't have stock in Importation
   * Returns a Set of product IDs that should be excluded
   */
  async filterProductsWithoutImportationStock(products: any[]): Promise<Set<string>> {
    const productsWithoutImportationStock = new Set<string>();
    const productsToCheckStock: Array<{
      product: any;
      importationId: string;
      cardName: string;
      language: string;
      foil: boolean;
    }> = [];

    for (const localProduct of products) {
      const product = localProduct;
      const tags = product.tags || [];
      const tagNames = (Array.isArray(tags) ? tags : [])
        .map((st: any) => st?.name || st?.tags?.name || (typeof st === 'string' ? st : ''))
        .filter(Boolean);

      const metadata = product.metadata || [];
      const isPersonal =
        tagNames.some((t: string) => t.toLowerCase() === 'personal') ||
        (Array.isArray(metadata) && metadata.includes('Personal'));

      if (isPersonal && product.importationId) {
        const languageCode = product.languages?.code || 'EN';
        productsToCheckStock.push({
          product: localProduct,
          importationId: String(product.importationId),
          cardName: product.cardName || 'Producto',
          language: languageCode,
          foil: !!product.foil,
        });
      }
    }

    if (productsToCheckStock.length > 0) {
      try {
        const importationIds = productsToCheckStock.map((p) => p.importationId);
        const cardNames = productsToCheckStock.map((p) => p.cardName);

        const pricingResult = await this.getImportationPricing({
          productIds: importationIds,
          cardNames: cardNames,
        });

        if (pricingResult.success && pricingResult.pricing) {
          for (const productToCheck of productsToCheckStock) {
            const matchingVariant = pricingResult.pricing.find((variant) => {
              const variantLanguage = (variant.language || 'ENGLISH').toUpperCase().trim();
              const productLanguage = this.normalizeLanguage(productToCheck.language)
                .toUpperCase()
                .trim();
              return (
                variant.productId === productToCheck.importationId &&
                variantLanguage === productLanguage &&
                productToCheck.foil === !!variant.isFoil
              );
            });

            if (matchingVariant) {
              this.logger.debug(
                `[MATCH STOCK] product importationId=${productToCheck.importationId} name=${productToCheck.cardName} -> ` +
                  `variant id=${matchingVariant.productId} lang=${matchingVariant.language} foil=${matchingVariant.isFoil} ` +
                  `(requested lang=${productToCheck.language} foil=${productToCheck.foil})`,
              );
            }

            if (!matchingVariant || (matchingVariant.stock || 0) <= 0) {
              productsWithoutImportationStock.add(String(productToCheck.product.id));
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error checking Importation stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return productsWithoutImportationStock;
  }

  /**
   * Helper to normalize language for comparison
   */
  normalizeLanguageForComparison(lang: string | undefined | null): string {
    return this.normalizeLanguage(lang);
  }
}
