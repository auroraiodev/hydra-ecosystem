import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkout(@CurrentUser() user: UserWithRole, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  /** @deprecated The ?mode=admin path — use GET /admin/orders from AdminOrdersController instead. */
  @ApiOperation({
    summary:
      'Get orders (User: own orders, Admin/Seller: use /admin/orders instead of ?mode=admin)',
  })
  @ApiResponse({ status: 200, description: 'List of orders', type: [OrderResponseDto] })
  async getUserOrders(
    @CurrentUser() user: UserWithRole,
    @Query('mode') mode?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    if ((user.role.name === 'ADMIN' || user.role.name === 'SELLER') && mode === 'admin') {
      return this.ordersService.getAllOrders(
        Number(page), Number(limit), search, status, userId,
        sortBy, (sortDir === 'asc' ? 'asc' : 'desc'),
      );
    }
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    const roleName = user.role?.name?.toUpperCase();
    if (roleName === 'ADMIN' || roleName === 'SELLER') {
      return this.ordersService.getOrderById(id);
    }
    return this.ordersService.getOrder(id, user.id);
  }

  @Post(':id/pay-with-wallet')
  @ApiOperation({ summary: 'Pay for an existing order using wallet' })
  @ApiResponse({ status: 200, description: 'Order paid successfully' })
  async payWithWallet(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    return this.ordersService.payWithWallet(user.id, id);
  }

  @Post(':id/pay-with-mercadopago')
  @ApiOperation({ summary: 'Create a Mercado Pago preference for an existing PENDING order' })
  @ApiResponse({ status: 200, description: 'MP preference created, returns initPoint' })
  async payWithMercadoPago(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    return this.ordersService.payWithMercadoPago(user.id, id);
  }

  @Post(':id/verify-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Mercado Pago payment status after redirect' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  async verifyPayment(
    @Param('id') id: string,
    @CurrentUser() user: UserWithRole,
    @Body('paymentId') paymentId: string,
  ) {
    return this.ordersService.verifyAndUpdatePayment(id, user.id, paymentId);
  }

  @Post(':id/items/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove items from order' })
  @ApiResponse({ status: 200, description: 'Items removed successfully', type: OrderResponseDto })
  async removeOrderItems(
    @Param('id') id: string,
    @CurrentUser() user: UserWithRole,
    @Body('itemIds') itemIds: string[],
  ) {
    return this.ordersService.removeOrderItems(id, itemIds, user.id, user.role.name);
  }
}
