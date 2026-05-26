import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { AdminCreateOrderDto } from './dto/admin-create-order.dto.js';
import { AddOrderItemDto } from './dto/add-order-item.dto.js';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto.js';
import { AdminCheckoutDto } from './dto/admin-checkout.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';

@ApiTags('orders - admin')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order as admin' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  async createOrderAsAdmin(@CurrentUser() user: UserWithRole, @Body() dto: AdminCreateOrderDto) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('You do not have permission to create orders for others');
    }
    return this.ordersService.createOrderAsAdmin(user.id, dto);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete orders' })
  @ApiResponse({ status: 200, description: 'Orders deleted successfully' })
  async bulkDeleteOrders(@CurrentUser() user: UserWithRole, @Body('ids') ids: string[]) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('You do not have permission to delete orders');
    }
    return this.ordersService.deleteOrders(ids);
  }

  @Post('admin/checkout-for-user/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: create order from a user cart (transfer / arrange)' })
  async adminCheckoutForUser(
    @CurrentUser() admin: UserWithRole,
    @Param('userId') userId: string,
    @Body() dto: AdminCheckoutDto,
  ) {
    if (admin.role.name !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return this.ordersService.createOrder(userId, {
      shippingMethod: dto.shippingMethod as any,
      paymentMethod: dto.paymentMethod,
    });
  }

  @Post('admin/:orderId/undo-to-cart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Undo order and move items back to cart (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order undone and items moved to cart' })
  @ApiResponse({ status: 400, description: 'Cannot undo Mercado Pago orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async undoOrderToCart(@Param('orderId') orderId: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can undo orders to cart');
    }
    await this.ordersService.undoOrderToCart(orderId);
    return { message: 'Order undone and items moved to cart' };
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get all sales history (Admin/Seller)' })
  @ApiResponse({ status: 200, description: 'List of sales transactions' })
  async getSales(
    @CurrentUser() user: UserWithRole,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('Only admins and sellers can view sales history');
    }
    return this.ordersService.getSales(Number(page), Number(limit));
  }

  @Post(':id/mark-paid-local')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: mark order as paid locally and zero out import fee' })
  async markPaidLocal(@CurrentUser() admin: UserWithRole, @Param('id') id: string) {
    if (admin.role.name !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return this.ordersService.markOrderPaidLocal(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (Admin/Seller)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('id') id: string,
    @CurrentUser() user: UserWithRole,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    if (user.role.name === 'ADMIN' || user.role.name === 'SELLER') {
      return this.ordersService.updateOrderById(id, updateOrderDto);
    }
    throw new ForbiddenException('You do not have permission to update orders');
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to order (Admin/Seller)' })
  @ApiResponse({ status: 201, description: 'Item added successfully', type: OrderResponseDto })
  async addOrderItem(
    @Param('id') id: string,
    @CurrentUser() user: UserWithRole,
    @Body() dto: AddOrderItemDto,
  ) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('You do not have permission to modify orders');
    }
    return this.ordersService.addOrderItem(id, dto);
  }

  @Patch(':id/items/:itemId/delivery-status')
  @ApiOperation({ summary: 'Update item delivery status' })
  @ApiResponse({ status: 200, description: 'Item delivery status updated', type: OrderResponseDto })
  async updateItemDeliveryStatus(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser() user: UserWithRole,
  ) {
    return this.ordersService.updateItemDeliveryStatus(id, itemId, dto, user.role.name);
  }

  @Get(':id/payment-balance')
  @ApiOperation({ summary: 'Get payment balance after order modification (Admin)' })
  async getOrderPaymentBalance(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('Only admins can check payment balance');
    }
    return this.ordersService.getOrderPaymentBalance(id);
  }

  @Post(':id/reopen-for-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a PAID order for supplemental Mercado Pago payment (Admin)' })
  async reopenOrderForSupplementalPayment(
    @Param('id') id: string,
    @CurrentUser() user: UserWithRole,
  ) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reopen orders for payment');
    }
    return this.ordersService.reopenOrderForSupplementalPayment(id);
  }

  @Patch(':id/items/discount-all')
  @ApiOperation({ summary: 'Discount all items in order (Admin/Seller)' })
  @ApiResponse({ status: 200, description: 'All items discounted successfully' })
  async discountAllItems(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN' && user.role.name !== 'SELLER') {
      throw new ForbiddenException('You do not have permission to discount items');
    }
    return this.ordersService.discountAllItems(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (Admin/Seller)' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name === 'ADMIN' || user.role.name === 'SELLER') {
      await this.ordersService.deleteOrderById(id);
      return;
    }
    throw new ForbiddenException('You do not have permission to delete orders');
  }

  @Patch(':id/request-review')
  @ApiOperation({ summary: 'Mark an order to request a review from the user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review request marked successfully' })
  async requestReview(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can request reviews');
    }
    return this.ordersService.requestReview(id);
  }
}
