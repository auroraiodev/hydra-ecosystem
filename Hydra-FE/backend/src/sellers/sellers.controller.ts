import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SellersService } from './sellers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto.js';
import { OrderPayoutRequestDto } from './dto/order-payout-request.dto.js';

@ApiTags('seller')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN') // Allow admins to view seller dashboard if needed, but primarily for sellers
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('dashboard')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Seller dashboard statistics retrieved successfully' })
  async getDashboardStats(@CurrentUser() user: UserWithRole) {
    return this.sellersService.getDashboardStats(user.id);
  }

  @Get('analytics/revenue')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller revenue analytics' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for revenue data' })
  async getRevenueAnalytics(
    @CurrentUser() user: UserWithRole,
    @Query('days', new ParseIntPipe({ optional: true })) days = 30,
  ) {
    return this.sellersService.getRevenueByPeriod(user.id, days || 30);
  }

  @Get('orders/stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller order statistics' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for stats' })
  async getOrderStats(
    @CurrentUser() user: UserWithRole,
    @Query('days', new ParseIntPipe({ optional: true })) days = 30,
  ) {
    return this.sellersService.getOrderStats(user.id, days || 30);
  }

  @Get('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getOrders(
    @CurrentUser() user: UserWithRole,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.sellersService.getOrders(
      user.id, Number(page), Number(limit),
      { status, search },
      sortBy, (sortDir === 'asc' ? 'asc' : 'desc'),
    );
  }

  @Get('orders/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller order by ID' })
  async getOrderById(@CurrentUser() user: UserWithRole, @Param('id') id: string) {
    return this.sellersService.getOrderById(user.id, id);
  }

  @Get('wallet')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller wallet' })
  async getWallet(@CurrentUser() user: UserWithRole) {
    return this.sellersService.getWallet(user.id);
  }

  @Get('wallet/pending')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller orders pending payout (PAID/PROCESSING/SHIPPED)' })
  async getPendingPayouts(@CurrentUser() user: UserWithRole) {
    return this.sellersService.getPendingPayouts(user.id);
  }

  @Post('wallet/withdrawal')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request a withdrawal' })
  async requestWithdrawal(@CurrentUser() user: UserWithRole, @Body() body: WithdrawalRequestDto) {
    return this.sellersService.requestWithdrawal(user.id, body.amount, body.details);
  }

  @Post('wallet/request-payout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request payout for specific unpaid orders' })
  async requestOrderPayout(@CurrentUser() user: UserWithRole, @Body() body: OrderPayoutRequestDto) {
    return this.sellersService.requestOrderPayout(user.id, body.orderIds, body.details);
  }
}
