import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  Sse,
  MessageEvent,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import type { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard, Public, CurrentUser } from '@hydra/auth';
import type { UserWithRole } from '@hydra/auth';
import { UsersService } from '../users/users.service.js';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(@CurrentUser() user: UserWithRole, @Query('limit') limit = 20) {
    return this.notificationsService.getNotifications(user.id, Number(limit));
  }

  @Sse('stream')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'SSE stream of real-time notifications (token via query param)' })
  async stream(@Query('token') token: string): Promise<Observable<MessageEvent>> {
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    this.logger.log(`SSE stream opened for user ${user.id}`);
    return this.notificationsService.getStream(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: UserWithRole) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
