# Importation Implementation Summary

## Overview
This document summarizes the enhancements made to the external product sourcing integration in `hydra-be`, now unified under the `Importation` domain.

## New Files Created

### 1. `src/importation/currency.service.ts`
- **Purpose**: Currency conversion service
- **Methods**:
  - `convertJPYToMXN()` - Converts Japanese Yen to Mexican Pesos (default rate: 0.15)

### 2. `src/importation/importation.service.ts`
- **Purpose**: Comprehensive external product sourcing service
- **Key Features**:
  - Browser-like headers to reduce 403 errors
  - Batch processing (5 products at a time with 200ms delays)
  - Variant matching (language + foil status)
  - Currency conversion (JPY → MXN)
  - Language mapping and transformation
  - Metadata extraction (foil, borderless, extended art, etc.)
  - Comprehensive error handling

- **Methods**:
  - `getImportationPricing()` - Fetch pricing for multiple products
  - `getPriceForSingle()` - Get price for a single product with variant matching
  - `getPricesForSingles()` - Bulk pricing for multiple products
  - `searchCards()` - Full card search with data transformation
  - `transformToImportationPricing()` - Transform API docs to pricing format
  - `transformImportationDocToSearchResult()` - Transform API docs to search results
  - `normalizeLanguage()` - Normalize language names
  - `formatSearchQuery()` - Format search queries (handles double-faced cards)
  - `getBrowserHeaders()` - Generate browser-like headers

### 3. `src/importation/importation.module.ts`
- **Purpose**: NestJS module for Importation services
- **Exports**: `ImportationService`, `CurrencyService`

### 4. `src/importation/dto/importation-pricing.dto.ts`
- **Purpose**: DTO for pricing requests
- **Fields**:
  - `productIds: string[]` - Array of external product IDs
  - `cardNames?: string[]` - Optional card names for better matching

## Enhanced Files

### 1. `src/search/search.service.ts`
**Enhancements**:
- ✅ Added browser-like headers (reduces 403 errors)
- ✅ Better error handling (returns empty results for 403 instead of throwing)
- ✅ Added logging with Logger
- ✅ Added `searchCards()` method that uses ImportationService for transformation
- ✅ Improved error messages and logging

**Changes**:
- Now uses `ImportationService` for transformed search results
- Headers include: User-Agent, Accept-Language, Referer, Origin, Sec-Fetch-*, etc.
- Handles 403 errors gracefully by returning empty results

### 2. `src/search/search.controller.ts`
**New Endpoints**:
- `GET /api/search/importation/cards?query=...&page=...` - Transformed search results
- `POST /api/search/importation/pricing` - Get pricing for multiple products

**Existing Endpoint** (Enhanced):
- `GET /api/search/importation?kw=...` - Now uses browser-like headers

### 3. `src/search/search.module.ts`
- Added `ImportationModule` import

### 4. `src/app.module.ts`
- Added `ImportationModule` to imports

## API Endpoints

### 1. Search (Raw API Response)
```
GET /api/search/importation?kw=Lightning+Bolt&rows=12&page=1
```
- Returns raw external API response
- Enhanced with browser-like headers
- Better error handling

### 2. Search (Transformed)
```
GET /api/search/importation/cards?query=Lightning+Bolt&page=1
```
- Returns transformed `ImportationSearchResult[]`
- Includes currency conversion (JPY → MXN)
- Language mapping to Spanish
- Metadata extraction
- Pagination info

### 3. Get Pricing
```
POST /api/search/importation/pricing
Body: {
  "productIds": ["12345", "67890"],
  "cardNames": ["Lightning Bolt", "Black Lotus"] // optional
}
```
- Returns pricing for multiple products
- Supports variant matching (language + foil)
- Returns all variants per product
- Batch processing (5 at a time)

## Key Improvements

### 1. Browser-like Headers
headers include User-Agent, Accept, Accept-Language, Referer, Origin, etc. to mimic a real browser session and reduce anti-bot detection.

### 2. Error Handling
- Returns empty results for 403 errors
- Continues processing other products if one fails
- Detailed error logging
- Error messages in response

### 3. Data Transformation
- Transforms to structured interfaces
- Currency conversion (JPY → MXN)
- Language mapping (codes → Spanish names)
- Metadata extraction
- Card name cleaning
- Set information extraction

### 4. Variant Matching
Matches products by language, foil status, and product ID.

### 5. Batch Processing
- Processes 5 products per batch
- 200ms delay between batches
- Prevents rate limiting

## Language Mapping
Includes comprehensive mapping from external provider codes to Spanish display names.

## Usage Examples

### Example 1: Get Pricing for Products
```typescript
const result = await importationService.getImportationPricing({
  productIds: ['12345', '67890'],
  cardNames: ['Lightning Bolt', 'Black Lotus'],
});
```

### Example 2: Search Cards
```typescript
const result = await importationService.searchCards({
  query: 'Lightning Bolt',
  page: 1,
});
```

### Example 3: Get Single Product Price
```typescript
const price = await importationService.getPriceForSingle({
  importation_product_id: '12345',
  is_foil: false,
  language: 'ENGLISH',
  name: 'Lightning Bolt',
});
```

## Testing
Endpoints are public and can be tested via Swagger UI at `http://localhost:3002/api` or via cURL.

## Next Steps
- ✅ Currency conversion implemented
- ✅ Browser-like headers implemented
- ✅ Error handling improved
- ✅ Data transformation added
- ✅ Variant matching implemented
- ✅ Batch processing added
- ✅ Language mapping added
- ✅ New endpoints created

**Note**: Database modifications were refactored to use `@map` for neutral field naming in Prisma.
