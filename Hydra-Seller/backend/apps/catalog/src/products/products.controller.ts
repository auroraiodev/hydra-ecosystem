import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateSingleDto } from './dto/create-single.dto.js';
import { CreateBundleDto } from './dto/create-bundle.dto.js';
import { UpdateSingleDto } from './dto/update-single.dto.js';
import { CreateBulkSinglesDto } from './dto/create-bulk-singles.dto.js';
import { UpdateSingleTagsDto } from './dto/update-single-tags.dto.js';
import { Public, JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@hydra/auth';
import type { UserWithRole } from '@hydra/auth';
import { RateLimit } from '@hydra/common';

@ApiTags('singles')
@Controller('singles')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create single product from Importation data (ADMIN, SELLER only)' })
  @ApiBody({ type: CreateSingleDto })
  @ApiResponse({
    status: 201,
    description: 'Single product created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Seller role required' })
  @ApiResponse({
    status: 404,
    description: 'Owner user, category, condition, or language not found',
  })
  @ApiResponse({ status: 409, description: 'Product already exists' })
  async create(@Body() createDto: CreateSingleDto, @CurrentUser() user: UserWithRole) {
    return this.productsService.create(createDto, user);
  }

  @Post('bundle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bundle product (optional condition/language) (ADMIN, SELLER only)',
  })
  @ApiBody({ type: CreateBundleDto })
  @ApiResponse({
    status: 201,
    description: 'Bundle product created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Seller role required' })
  async createBundle(@Body() createDto: CreateBundleDto, @CurrentUser() user: UserWithRole) {
    return this.productsService.createBundle(createDto, user);
  }

  @Post('batch')
  @Public()
  @RateLimit({ limit: 60, ttl: 60000 }) // 60 batch requests per minute per IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get multiple single products by IDs (max 50)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findByIds(@Body() body: { ids: string[] }) {
    if (!Array.isArray(body.ids) || body.ids.length > 50) {
      throw new BadRequestException('ids must be an array with at most 50 items');
    }
    // Strip any non-UUID values (e.g. Hareruya composite IDs stored in
    // client localStorage) before forwarding to the service/Prisma layer.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = body.ids.filter((id) => UUID_REGEX.test(id));
    return this.productsService.findByIds(validIds);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple single products at once (ADMIN, SELLER only)' })
  @ApiBody({ type: CreateBulkSinglesDto })
  @ApiResponse({
    status: 201,
    description: 'Products created successfully (some may have failed)',
  })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Seller role required' })
  async createBulk(@Body() bulkDto: CreateBulkSinglesDto, @CurrentUser() user: UserWithRole) {
    return this.productsService.createBulk(bulkDto.products, user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tcgId') tcgId?: string,
    @Query('expansion') expansion?: string,
    @Query('inStock') inStock?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.productsService.findAll(page, limit, search, {
      category,
      tcgId,
      expansion,
      inStock: inStock === 'true',
      ownerId,
    });
  }

  @Get('expansions')
  @Public()
  @ApiOperation({ summary: 'Get all unique expansions/sets present in singles' })
  async getExpansions() {
    return this.productsService.getUniqueExpansions();
  }

  @Get('local')
  @Public()
  @ApiOperation({ summary: 'Get all local inventory singles with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Local singles retrieved successfully',
  })
  async findLocal(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findLocal(page, limit);
  }

  @Get('search')
  @Public()
  /** @deprecated No frontend calls this — use GET /search/local instead. */
  @ApiOperation({ summary: '[Deprecated] Advanced search for singles (use /search/local instead)' })
  @ApiQuery({ name: 'name', required: false, description: 'Card name to search for' })
  @ApiQuery({
    name: 'conditions',
    required: false,
    description: 'Comma-separated condition names (e.g. NM,SP)',
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Comma-separated language names (e.g. English,Japanese)',
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Singles found',
  })
  async search(
    @Query('name') name?: string,
    @Query('conditions') conditions?: string,
    @Query('languages') languages?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('expansion') expansion?: string,
  ) {
    const conditionList = conditions ? conditions.split(',').map((c) => c.trim()) : undefined;
    const languageList = languages ? languages.split(',').map((l) => l.trim()) : undefined;

    return this.productsService.findAll(page, limit, name, {
      conditions: conditionList,
      languages: languageList,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      expansion,
    });
  }

  @Get('owner/:ownerId')
  @Public()
  @ApiOperation({ summary: 'Get all products owned by a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  async findByOwner(
    @Param('ownerId') ownerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findByOwner(ownerId, page, limit);
  }

  @Patch(':id/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product tags (ADMIN, SELLER only)' })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiBody({ type: UpdateSingleTagsDto })
  @ApiResponse({ status: 200, description: 'Product tags updated successfully' })
  async updateTags(
    @Param('id') id: string,
    @Body() body: UpdateSingleTagsDto,
    @CurrentUser() user: UserWithRole,
  ) {
    return this.productsService.updateTags(id, body.tags, user);
  }

  @Patch(':id/owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change product ownership (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        owner_id: {
          type: 'string',
          description: 'New owner user ID (UUID)',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product owner updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product or new owner not found' })
  async changeOwner(
    @Param('id') id: string,
    @Body() body: { owner_id: string },
    @CurrentUser() user: UserWithRole,
  ) {
    return this.productsService.update(id, { owner_id: body.owner_id }, user);
  }

  @Patch(':id/foil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product foil status (ADMIN, SELLER only)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foil: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product foil status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateFoil(
    @Param('id') id: string,
    @Body() body: { foil: boolean },
    @CurrentUser() user: UserWithRole,
  ) {
    return this.productsService.updateFoil(id, body.foil, user);
  }

  @Get('importation/:importationId')
  @Public()
  @ApiOperation({ summary: 'Get a product by its importation (Hareruya) ID' })
  @ApiParam({ name: 'importationId', description: 'Hareruya / importation numeric ID' })
  @ApiQuery({ name: 'cardName', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findByImportationId(
    @Param('importationId') importationId: string,
    @Query('cardName') cardName?: string,
    @Query('language') language?: string,
  ) {
    return this.productsService.findByImportationId(importationId, cardName, language);
  }

  @Get(':id/alternatives')
  @Public()
  @ApiOperation({ summary: 'Get alternative versions of a product (same card name, in stock)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max results (default 10)',
  })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Alternative versions found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findAlternativeVersions(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findAlternativeVersions(id, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('update-to-local-inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update all products to have isLocalInventory=true (ADMIN only)',
    description:
      'Fixes products that were incorrectly set with isLocalInventory=false. Updates all products in the database to have isLocalInventory=true since they are registered in the local database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        updated: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updateAllProductsToLocalInventory() {
    return this.productsService.updateAllProductsToLocalInventory();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a single product (ADMIN, SELLER only)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateSingleDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSingleDto,
    @CurrentUser() user: UserWithRole,
  ) {
    return this.productsService.update(id, updateDto, user);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple single products (ADMIN, SELLER only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Products deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Seller role required' })
  async removeBulk(@Body() body: { ids: string[] }, @CurrentUser() user: UserWithRole) {
    return this.productsService.removeBulk(body.ids, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a single product (ADMIN, SELLER only)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Seller role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    return this.productsService.remove(id, user);
  }
}
