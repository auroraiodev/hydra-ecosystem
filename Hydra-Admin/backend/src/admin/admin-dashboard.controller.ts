import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('admin - dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'categoryIds', required: false, description: 'Filter by categories' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    const filter: any = {};
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    if (categoryIds) filter.categoryIds = categoryIds.split(',');
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    return this.adminService.getDashboardStats(filter);
  }
}
