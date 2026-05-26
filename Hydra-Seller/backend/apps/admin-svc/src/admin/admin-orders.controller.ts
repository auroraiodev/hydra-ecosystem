import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, RolesGuard, Roles } from '@hydra/auth';
import { UpdateOrderAdminDto } from './dto/update-order-admin.dto.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { CancelOrderDto } from './dto/cancel-order.dto.js';
import { ShipOrderDto } from './dto/ship-order.dto.js';
import { DeliverOrderDto } from './dto/deliver-order.dto.js';
import { BulkUpdateOrdersDto } from './dto/bulk-update-orders.dto.js';

@ApiTags('admin - orders')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders/stats')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: day, week, month, year' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  async getOrderStats(
    @Query('period') period?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filter: any = {};
    if (period) filter.period = period;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    return this.adminService.getOrderStatistics(filter);
  }

  @Get('orders')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders with filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by order ID or user name' })
  async getOrders(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    if (search) filter.search = search;
    return this.adminService.getOrders({ ...filter, page, limit });
  }

  @Get('orders/:id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderById(id);
  }

  @Put('orders/:id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: UpdateOrderAdminDto,
  ) {
    return this.adminService.updateOrder(id, updateData);
  }

  @Post('orders/:id/assign')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign order to admin' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async assignOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignmentData: AssignOrderDto,
  ) {
    return this.adminService.assignOrder(id, assignmentData);
  }

  @Post('orders/:id/cancel')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async cancelOrder(@Param('id', ParseUUIDPipe) id: string, @Body() cancelData: CancelOrderDto) {
    return this.adminService.cancelOrder(id, cancelData);
  }

  @Post('orders/:id/ship')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark order as shipped' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async shipOrder(@Param('id', ParseUUIDPipe) id: string, @Body() shippingData: ShipOrderDto) {
    return this.adminService.shipOrder(id, shippingData);
  }

  @Post('orders/:id/deliver')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async deliverOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() deliveryData: DeliverOrderDto,
  ) {
    return this.adminService.deliverOrder(id, deliveryData);
  }

  @Post('orders/bulk-update')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update orders' })
  async bulkUpdateOrders(@Body() bulkData: BulkUpdateOrdersDto) {
    return this.adminService.bulkUpdateOrders(bulkData);
  }
}
