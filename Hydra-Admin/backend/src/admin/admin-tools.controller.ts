import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { NotificationsService, NotificationType } from '../notifications/notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RateLimit } from '../common/decorators/rate-limit.decorator.js';
import { CreateAuditLogDto } from './dto/create-audit-log.dto.js';
import { TriggerBackupDto } from './dto/trigger-backup.dto.js';
import { ClearCacheDto } from './dto/clear-cache.dto.js';
import { RestoreDatabaseDto } from './dto/restore-database.dto.js';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto.js';

@ApiTags('admin - tools')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminToolsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('audit/logs')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 100, ttl: 60000 })
  @ApiOperation({ summary: 'Create audit log entry' })
  async createAuditLog(@Body() auditLogData: CreateAuditLogDto) {
    return this.adminService.createAuditLog(auditLogData);
  }

  @Post('maintenance/backup')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 1, ttl: 600000 })
  @ApiOperation({ summary: 'Trigger database backup' })
  async triggerBackup(@Body() backupConfig: TriggerBackupDto) {
    return this.adminService.triggerBackup(backupConfig);
  }

  @Post('maintenance/cache/clear')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 5, ttl: 60000 })
  @ApiOperation({ summary: 'Clear application cache' })
  async clearCache(@Body() body: ClearCacheDto) {
    return this.adminService.clearCache(body.pattern);
  }

  @Post('maintenance/restore')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @RateLimit({ limit: 1, ttl: 600000 })
  @ApiOperation({ summary: 'Restore database from backup' })
  async restoreDatabase(@Body() restoreData: RestoreDatabaseDto) {
    if (!restoreData.confirm) {
      throw new BadRequestException('Confirmation required to proceed with database restore');
    }
    return this.adminService.restoreDatabase(restoreData.backupFile);
  }

  @Get('export/data')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export system data' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Export type: users, orders, products, categories',
  })
  @ApiQuery({ name: 'format', required: false, description: 'Export format: json, csv, xlsx' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  async exportData(
    @Query('type') type: string,
    @Query('format') format = 'json',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const exportConfig: Record<string, unknown> = { type, format };
    if (dateFrom) exportConfig.dateFrom = new Date(dateFrom);
    if (dateTo) exportConfig.dateTo = new Date(dateTo);
    return this.adminService.exportData(exportConfig);
  }

  @Get('notifications')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get system notifications' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Notification type: info, warning, error',
  })
  @ApiQuery({ name: 'unread', required: false, description: 'Filter unread only' })
  async getNotifications() {
    return this.adminService.getNotifications();
  }

  @Post('notifications/:id/mark-read')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markNotificationRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.markNotificationRead(id);
  }

  @Post('notifications/broadcast')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send a test notification to a specific user or all admins' })
  async broadcastNotification(@Body() body: BroadcastNotificationDto) {
    if (body.userId) {
      await this.notificationsService.createNotification({
        userId: body.userId,
        type: NotificationType.ADMIN_ALERT,
        title: body.title,
        message: body.message,
      });
      return { success: true, target: 'user', userId: body.userId };
    }
    await this.notificationsService.notifyAdmins({
      type: NotificationType.ADMIN_ALERT,
      title: body.title,
      message: body.message,
    });
    return { success: true, target: 'admins' };
  }
}
