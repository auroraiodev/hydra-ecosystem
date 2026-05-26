import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  HttpException,
  HttpStatus as NestHttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { MergeCartItemsDto } from './dto/merge-cart-items.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  async getCart(@CurrentUser() user: UserWithRole) {
    try {
      this.logger.log(`Getting cart for user ${user.id}`);
      const items = await this.cartService.getCart(user.id);
      this.logger.log(`Successfully retrieved cart with ${items.length} items for user ${user.id}`);
      return {
        success: true,
        data: items,
      };
    } catch (error) {
      this.logger.error(`Error getting cart for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        NestHttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cart summary with calculated totals' })
  @ApiResponse({
    status: 200,
    description: 'Cart summary retrieved successfully',
  })
  async getCartSummary(
    @CurrentUser() user: UserWithRole,
    @Query('shippingMethod') shippingMethod?: string,
    @Query('itemIds') itemIds?: string | string[],
  ) {
    const ids = typeof itemIds === 'string' ? itemIds.split(',') : itemIds;
    const summary = await this.cartService.getCartSummary(user.id, shippingMethod, ids);
    return {
      success: true,
      data: summary,
    };
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
  })
  async addItem(@CurrentUser() user: UserWithRole, @Body() addItemDto: AddCartItemDto) {
    this.logger.log(`Adding item to cart for user ${user.id}: ${JSON.stringify(addItemDto)}`);
    const item = await this.cartService.addItem(user.id, addItemDto);
    return {
      success: true,
      data: item,
    };
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge guest cart items into user cart' })
  @ApiResponse({
    status: 200,
    description: 'Guest cart merged successfully',
  })
  async mergeGuestCart(@CurrentUser() user: UserWithRole, @Body() mergeDto: MergeCartItemsDto) {
    this.logger.log(`Merging guest cart for user ${user.id}: ${JSON.stringify(mergeDto)}`);
    const items = await this.cartService.mergeGuestCart(user.id, mergeDto.items);
    return {
      success: true,
      data: items,
    };
  }

  @Put('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  async updateItem(
    @CurrentUser() user: UserWithRole,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const item = await this.cartService.updateItem(user.id, itemId, updateDto);
    return {
      success: true,
      data: item,
    };
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  async removeItem(@CurrentUser() user: UserWithRole, @Param('itemId') itemId: string) {
    const result = await this.cartService.removeItem(user.id, itemId);
    return result;
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(@CurrentUser() user: UserWithRole) {
    const result = await this.cartService.clearCart(user.id);
    return result;
  }

  // ==================== Admin Cart Endpoints ====================

  @Get('admin/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Admin: Get any user's cart" })
  @ApiResponse({ status: 200, description: 'User cart retrieved successfully' })
  async adminGetCart(@Param('userId') userId: string) {
    this.logger.log(`Admin getting cart for user ${userId}`);
    const items = await this.cartService.getCart(userId);
    return { success: true, data: items };
  }

  @Get('admin/:userId/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Get cart summary for any user' })
  @ApiResponse({ status: 200, description: 'Cart summary retrieved successfully' })
  async adminGetCartSummary(
    @Param('userId') userId: string,
    @Query('shippingMethod') shippingMethod?: string,
  ) {
    const summary = await this.cartService.getCartSummary(userId, shippingMethod);
    return { success: true, data: summary };
  }

  @Post('admin/:userId/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Admin: Add item to any user's cart" })
  @ApiResponse({ status: 201, description: 'Item added to user cart successfully' })
  async adminAddItem(@Param('userId') userId: string, @Body() addItemDto: AddCartItemDto) {
    this.logger.log(`Admin adding item to cart for user ${userId}`);
    const item = await this.cartService.addItem(userId, addItemDto);
    return { success: true, data: item };
  }

  @Put('admin/:userId/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Update cart item quantity for any user' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  async adminUpdateItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    this.logger.log(`Admin updating cart item ${itemId} for user ${userId}`);
    const item = await this.cartService.updateItem(userId, itemId, updateDto);
    return { success: true, data: item };
  }

  @Delete('admin/:userId/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Admin: Remove item from any user's cart" })
  @ApiResponse({ status: 200, description: 'Item removed from user cart successfully' })
  async adminRemoveItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    this.logger.log(`Admin removing cart item ${itemId} for user ${userId}`);
    const result = await this.cartService.removeItem(userId, itemId);
    return result;
  }

  @Delete('admin/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Admin: Clear any user's cart" })
  @ApiResponse({ status: 200, description: 'User cart cleared successfully' })
  async adminClearCart(@Param('userId') userId: string) {
    this.logger.log(`Admin clearing cart for user ${userId}`);
    const result = await this.cartService.clearCart(userId);
    return result;
  }
}
