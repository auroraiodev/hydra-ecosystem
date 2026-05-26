import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, RolesGuard, Roles } from '@hydra/auth';
import { parsePeriod } from './admin.utils.js';

@ApiTags('admin - analytics')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics/users')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user analytics data' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for growth data' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.adminService.getUserGrowth(days);
  }

  @Get('analytics/orders')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order analytics data' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for stats data' })
  @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
  async getOrderAnalytics(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.adminService.getOrderStats(days);
  }

  @Get('analytics/revenue')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get revenue analytics data' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for revenue data' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.adminService.getRevenueByPeriod(days);
  }

  @Get('analytics/products')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get product analytics data' })
  @ApiQuery({ name: 'top', required: false })
  @ApiQuery({ name: 'lowStock', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false, description: '1-12' })
  async getProductAnalytics(
    @Query('top', new DefaultValuePipe(10), ParseIntPipe) top: number,
    @Query('lowStock', new DefaultValuePipe(5), ParseIntPipe) lowStock: number,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const { startDate, endDate } = parsePeriod(yearStr, monthStr);
    return this.adminService.getProductAnalytics(top, lowStock, startDate, endDate);
  }

  @Get('analytics/buyers')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get buyer behavior analytics' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false, description: '1-12' })
  async getBuyerAnalytics(@Query('year') yearStr?: string, @Query('month') monthStr?: string) {
    const { startDate, endDate } = parsePeriod(yearStr, monthStr);
    return this.adminService.getBuyerStats(startDate, endDate);
  }
}
