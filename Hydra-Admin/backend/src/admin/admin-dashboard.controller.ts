import { Controller, Get, Post, Delete, Query, Body, Param, UseGuards, Req } from '@nestjs/common';
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

  @Get('presence/online')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get users currently browsing the store' })
  @ApiResponse({ status: 200, description: 'List of online users' })
  async getOnlineUsers() {
    return this.adminService.getOnlineUsers();
  }

  @Get('presence/history')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Search page visit history' })
  async getPresenceHistory(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('ip') ip?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getPresenceHistory({
      userId,
      page,
      ip,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('presence/blocked-ips')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List blocked IPs' })
  async getBlockedIps() {
    return this.adminService.getBlockedIps();
  }

  @Post('presence/block-ip')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Block an IP address' })
  async blockIp(
    @Body() body: { ip: string; reason?: string },
    @Req() req: any,
  ) {
    return this.adminService.blockIp(body.ip, body.reason, req.user?.userId);
  }

  @Delete('presence/block-ip/:ip')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unblock an IP address' })
  async unblockIp(@Param('ip') ip: string) {
    await this.adminService.unblockIp(ip);
    return { success: true };
  }

  @Get('presence/blocked-users')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List blocked users' })
  async getBlockedUsers() {
    return this.adminService.getBlockedUsers();
  }

  @Post('presence/block-user')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Body() body: { userId: string; reason?: string },
    @Req() req: any,
  ) {
    return this.adminService.blockUser(body.userId, body.reason, req.user?.userId);
  }

  @Delete('presence/block-user/:userId')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('userId') userId: string) {
    await this.adminService.unblockUser(userId);
    return { success: true };
  }
}
