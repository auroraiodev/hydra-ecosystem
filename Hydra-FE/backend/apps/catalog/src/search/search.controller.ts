import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SearchService } from './search.service.js';
import { SearchImportationDto } from './dto/search-importation.dto.js';
import { SearchImportationMTGDto } from './dto/search-importation-mtg.dto.js';
import { ImportationPricingDto } from '../importation/dto/importation-pricing.dto.js';
import { ImportationService } from '../importation/importation.service.js';
import { CacheService } from '@hydra/common';
import { Public } from '@hydra/auth';

export class HybridSearchDto {
  @ApiProperty({
    description: 'Search query (card name)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiProperty({
    description: 'Page number (default: 1)',
    required: false,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of results per page (default: 12)',
    required: false,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Filter by conditions (comma-separated IDs)',
    required: false,
  })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiProperty({
    description: 'Filter by languages (comma-separated codes)',
    required: false,
  })
  @IsOptional()
  @IsString()
  languages?: string;

  @ApiProperty({
    description: 'Filter by foil status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsString()
  foil?: string;

  @ApiProperty({
    description: 'Filter by in stock status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsString()
  inStock?: string;

  @ApiProperty({
    description: 'Filter by minimum price',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum price',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by card expansions (sets), comma-separated',
  })
  @IsOptional()
  @IsString()
  expansions?: string;

  @ApiPropertyOptional({
    description: 'Filter by TCG ID (defaults to Magic: The Gathering)',
  })
  @IsOptional()
  @IsString()
  tcgId?: string;
}

@ApiTags('search')
@SkipThrottle()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly importationService: ImportationService,
    private readonly cacheService: CacheService,
  ) {}
  @Get('test-mtgsrc')
  @Public()
  async testMtgsrc() {
    try {
      const results = await this.importationService.searchCards({
        query: 'The One Ring',
        rows: 1,
      });
      return {
        success: true,
        message: 'Successfully connected to mtgsrc service',
        data: results.data[0] || null,
        total: results.pagination?.totalItems || 0,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to mtgsrc service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.stack : undefined,
      };
    }
  }

  @Get('importation')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Importation Set',
    description:
      'Returns transformed search results with MXN prices, language mapping, foil status, card numbers, and metadata extraction',
  })
  @ApiQuery({
    name: 'kw',
    required: true,
    description: 'Search keyword (card name)',
  })
  @ApiQuery({
    name: 'rows',
    required: false,
    description: 'Number of results per page (default: 60)',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'fq.price',
    required: false,
    description: 'Price filter (default: "1~*")',
  })
  @ApiQuery({
    name: 'conditions',
    required: false,
    description: 'Filter by conditions (comma-separated IDs)',
    type: String,
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Filter by languages (comma-separated codes)',
    type: String,
  })
  @ApiQuery({
    name: 'foil',
    required: false,
    description: 'Filter by foil status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter by in stock status',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Pure Importation Data',
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchImportationMTG(
    @Query('kw') kw: string,
    @Query('rows') rows?: number,
    @Query('page') page?: number,
    @Query('fq.price') priceFilter?: string,
    @Query('conditions') conditions?: string,
    @Query('languages') languages?: string,
    @Query('foil') foil?: string,
    @Query('inStock') inStock?: string,
  ) {
    if (!kw || kw.trim() === '') {
      throw new BadRequestException('Keyword (kw) is required');
    }
    const searchDto: SearchImportationMTGDto = {
      kw: kw.trim(),
      rows: rows ? Number(rows) : 12,
      page: page ? Number(page) : 1,
      priceFilter,
    };

    return this.searchService.searchImportationMTG(searchDto, {
      conditions: conditions ? conditions.split(',').map((c) => c.trim()) : undefined,
      languages: languages ? languages.split(',').map((l) => l.trim()) : undefined,
      foil: foil === 'true' ? true : foil === 'false' ? false : undefined,
      inStock: inStock === 'true',
    });
  }

  @Get('importation-general')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Importation API for cards',
    description:
      'Returns transformed search results with MXN prices, language mapping, foil status, card numbers, and metadata extraction',
  })
  @ApiQuery({
    name: 'kw',
    required: true,
    description: 'Search keyword (card name)',
  })
  @ApiQuery({
    name: 'rows',
    required: false,
    description: 'Number of results per page (default: 60)',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'fq.price',
    required: false,
    description: 'Price filter (default: "1~*")',
  })
  @ApiQuery({
    name: 'conditions',
    required: false,
    description: 'Filter by conditions (comma-separated IDs)',
    type: String,
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Filter by languages (comma-separated codes)',
    type: String,
  })
  @ApiQuery({
    name: 'foil',
    required: false,
    description: 'Filter by foil status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter by in stock status',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Transformed search results with MXN prices and metadata',
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchImportation(
    @Query('kw') kw: string,
    @Query('rows') rows?: number,
    @Query('page') page?: number,
    @Query('fq.price') priceFilter?: string,
    @Query('conditions') conditions?: string,
    @Query('languages') languages?: string,
    @Query('foil') foil?: string,
    @Query('inStock') inStock?: string,
  ) {
    if (!kw || kw.trim() === '') {
      throw new BadRequestException('Keyword (kw) is required');
    }

    const searchDto: SearchImportationDto = {
      kw: kw.trim(),
      rows: rows ? Number(rows) : 12,
      page: page ? Number(page) : 1,
      priceFilter,
    };
    return this.searchService.searchImportation(searchDto, {
      conditions: conditions ? conditions.split(',').map((c) => c.trim()) : undefined,
      languages: languages ? languages.split(',').map((l) => l.trim()) : undefined,
      foil: foil === 'true' ? true : foil === 'false' ? false : undefined,
      inStock: inStock === 'true',
    });
  }

  @Post('importation/pricing')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Importation pricing for multiple products',
    description:
      'Fetches pricing for multiple Importation products with variant matching (language and foil status)',
  })
  @ApiBody({ type: ImportationPricingDto })
  @ApiResponse({
    status: 200,
    description: 'Pricing results from Importation API',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async getImportationPricing(@Body() dto: ImportationPricingDto) {
    return this.importationService.getImportationPricing({
      productIds: dto.productIds,
      cardNames: dto.cardNames,
    });
  }

  @Get('autocomplete')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get card name autocomplete suggestions from Scryfall',
    description: 'Returns card name suggestions using Scryfall API autocomplete endpoint',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Search query (minimum 2 characters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of card name suggestions',
    type: [String],
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameter' })
  async autocomplete(@Query('query') query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const suggestions = await this.searchService.autocomplete(query.trim());
    return suggestions;
  }

  @Get('hybrid')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hybrid search: Search both Importation API and local database',
    description:
      'Searches Importation API and local database, synchronizes prices when matches are found (by importationId, foil, and language), applies condition discounts to local products, and returns combined results with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Combined search results from Importation and local database with pagination',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        localCount: { type: 'number' },
        importationCount: { type: 'number' },
        updatedPrices: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameter' })
  async searchHybrid(@Query() searchDto: HybridSearchDto) {
    const {
      q,
      page,
      limit,
      conditions,
      languages,
      foil,
      inStock,
      minPrice,
      maxPrice,
      expansions,
      tcgId,
    } = searchDto;

    if (!q || q.trim() === '') {
      throw new BadRequestException('Query parameter (q) is required');
    }

    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 12;

    if (pageNum < 1) throw new BadRequestException('Page must be at least 1');
    if (limitNum < 1) throw new BadRequestException('Limit must be at least 1');

    return this.searchService.searchHybrid(q.trim(), pageNum, limitNum, {
      conditions: conditions ? conditions.split(',').map((c) => c.trim()) : undefined,
      languages: languages ? languages.split(',').map((l) => l.trim()) : undefined,
      foil: foil === 'true' ? true : foil === 'false' ? false : undefined,
      inStock: inStock === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      expansions: expansions ? expansions.split(',').map((e) => e.trim()) : undefined,
      tcgId: tcgId || 'bd789d3f-5569-4971-890e-e261e145e42c', // Default to MTG
    });
  }

  @Get('local')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Local search: Search only local database',
    description:
      'Searches only local database, applies condition discounts to local products, and returns results. If no query is provided, returns the latest added items. Pagination is optional and only returned if enabled via the paginate parameter.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query (card name). If not provided, returns latest added items',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1, only used if pagination is enabled)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results per page (default: 12)',
    type: Number,
  })
  @ApiQuery({
    name: 'paginate',
    required: false,
    description: 'Enable pagination (default: false). If true, returns pagination object',
    type: Boolean,
  })
  @ApiQuery({
    name: 'metadata',
    required: false,
    description: 'Filter by metadata (e.g., "commander")',
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category name (e.g., "singles")',
    type: String,
  })
  @ApiQuery({
    name: 'tcgId',
    required: false,
    description: 'Filter by TCG ID',
    type: String,
  })
  @ApiQuery({
    name: 'conditions',
    required: false,
    description: 'Filter by conditions (comma-separated IDs)',
    type: String,
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Filter by languages (comma-separated codes)',
    type: String,
  })
  @ApiQuery({
    name: 'foil',
    required: false,
    description: 'Filter by foil status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter by in stock status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Filter by minimum price',
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Filter by maximum price',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Local search results. Pagination object is only included if paginate=true',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        localCount: { type: 'number' },
      },
      required: ['success', 'data', 'localCount'],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameter' })
  async searchLocal(
    @Query('q') q?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('paginate') paginate?: string,
    @Query('metadata') metadata?: string,
    @Query('category') category?: string,
    @Query('expansion') expansion?: string,
    @Query('tcgId') tcgId?: string,
    @Query('conditions') conditions?: string,
    @Query('languages') languages?: string,
    @Query('foil') foil?: string,
    @Query('inStock') inStock?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('expansions') expansions?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 12;
    const enablePagination = paginate === 'true' || paginate === '1';
    const metadataFilter = metadata ? metadata.trim() : undefined;
    const categoryFilter = category ? category.trim() : undefined;
    const expansionFilter = expansion ? expansion.trim() : undefined;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be at least 1');
    }

    if (limitNum < 1) {
      throw new BadRequestException('Limit must be at least 1');
    }

    const query = q ? q.trim() : null;
    return this.searchService.searchLocal(
      query,
      pageNum,
      limitNum,
      enablePagination,
      metadataFilter,
      categoryFilter,
      expansionFilter,
      tcgId,
      {
        conditions: conditions ? conditions.split(',').map((c) => c.trim()) : undefined,
        languages: languages ? languages.split(',').map((l) => l.trim()) : undefined,
        foil: foil === 'true' ? true : foil === 'false' ? false : undefined,
        inStock: inStock === 'true',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        expansions: expansions ? expansions.split(',').map((e) => e.trim()) : undefined,
      },
    );
  }

  @Post('invalidate-home')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidate homepage section cache',
    description:
      'Clears all cached search results for the homepage sections (latest, commander, cEDH, bundles, precons, micas). Use after product updates to force a refresh.',
  })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  async invalidateHomeCache() {
    return { success: true, message: 'Home page cache invalidated (neutralized)' };
  }
}
