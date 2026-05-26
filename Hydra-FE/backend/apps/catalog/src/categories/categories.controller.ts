import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '@hydra/auth';
import { RolesGuard } from '@hydra/auth';
import { Roles } from '@hydra/auth';
import { Public } from '@hydra/auth';
import { CacheService } from '@hydra/common';
import { RateLimit } from '@hydra/common';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const cacheKey = `categories:page:${page}:limit:${limit}:search:${search || 'none'}:active:${isActive || 'all'}`;

    return this.categoriesService.findAll({
      page,
      limit,
      search,
      isActive,
      cacheKey,
    });
  }

  @Get('with-products')
  @Public()
  @ApiOperation({ summary: 'Get categories with active products' })
  @ApiQuery({ name: 'tcgId', required: false, description: 'Filter by TCG ID' })
  @ApiResponse({ status: 200, description: 'Categories with products retrieved successfully' })
  async findWithProducts(@Query('tcgId', new ParseUUIDPipe({ optional: true })) tcgId?: string) {
    return this.categoriesService.findWithProducts(tcgId);
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get only active categories' })
  @ApiQuery({ name: 'tcgId', required: false, description: 'Filter by TCG ID' })
  @ApiQuery({
    name: 'includeEmpty',
    required: false,
    description: 'Include categories with no products (admin use)',
  })
  @ApiResponse({ status: 200, description: 'Active categories retrieved successfully' })
  async findActive(
    @Query('tcgId', new ParseUUIDPipe({ optional: true })) tcgId?: string,
    @Query('includeEmpty') includeEmpty?: string,
  ) {
    return this.categoriesService.findActive(tcgId, includeEmpty === 'true');
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 10, ttl: 60000 }) // 10 creates per minute
  @ApiOperation({ summary: 'Create new category (ADMIN only)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return category;
  }

  @Put(':id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 20, ttl: 60000 }) // 20 updates per minute
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return category;
  }

  @Patch(':id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 20, ttl: 60000 })
  @ApiOperation({ summary: 'Patch category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return category;
  }

  @Patch(':id/toggle')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 30, ttl: 60000 }) // 30 toggles per minute
  @ApiOperation({ summary: 'Toggle category active status' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.toggleActive(id);
    return category;
  }

  @Delete(':id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 5, ttl: 60000 }) // 5 deletions per minute
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.remove(id);
    return category;
  }

  @Post('bulk')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 2, ttl: 300000 }) // 2 bulk operations per 5 minutes
  @ApiOperation({ summary: 'Bulk create categories' })
  @ApiBody({ type: [CreateCategoryDto] })
  @ApiResponse({ status: 201, description: 'Categories created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkCreate(@Body() createCategoriesDto: CreateCategoryDto[]) {
    const categories = await this.categoriesService.bulkCreate(createCategoriesDto);
    return categories;
  }

  @Post('reorder')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 10, ttl: 60000 }) // 10 reorders per minute
  @ApiOperation({ summary: 'Reorder categories' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { categories: { type: 'array', items: { type: 'object' } } },
    },
  })
  @ApiResponse({ status: 200, description: 'Categories reordered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(@Body('categories') categories: Array<{ id: string; order: number }>) {
    const result = await this.categoriesService.reorder(categories);
    return result;
  }
}
