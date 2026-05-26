import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { CreateNotificationDto, NotifyAdminsDto } from './dto/create-notification.dto.js';
import { SendEmailDto } from './dto/send-email.dto.js';
import { ApiKeyGuard } from '../common/api-key.guard.js';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiSecurity('x-internal-key')
@Controller()
@UseGuards(ApiKeyGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check (internal)',
    description: 'Health endpoint for the notification service. Requires internal API key.',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid internal API key.' })
  health() {
    return { status: 'ok', service: 'hydra-notify' };
  }

  @Post('notify/user')
  @ApiOperation({
    summary: 'Create a notification for a user',
    description:
      'Creates a notification for a specific user. Optionally sends a push notification ' +
      'if the user has push subscriptions. Consumed by hydra-be.',
  })
  @ApiResponse({ status: 201, description: 'Notification created and sent.' })
  @ApiResponse({ status: 400, description: 'Invalid input — validation failed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid internal API key.' })
  createNotification(@Body() dto: CreateNotificationDto) {
    return this.service.createNotification(dto);
  }

  @Post('notify/admins')
  @ApiOperation({
    summary: 'Notify all admin users',
    description:
      'Broadcasts a notification to all users with the ADMIN role. ' +
      'Consumed by hydra-be for system alerts.',
  })
  @ApiResponse({ status: 201, description: 'Admin notifications sent.' })
  @ApiResponse({ status: 400, description: 'Invalid input — validation failed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid internal API key.' })
  notifyAdmins(@Body() dto: NotifyAdminsDto) {
    return this.service.notifyAdmins(dto);
  }

  @Post('email')
  @ApiOperation({
    summary: 'Send a transactional email',
    description:
      'Sends a transactional email based on a predefined template target ' +
      '(e.g., purchase confirmation, payment notification). ' +
      'Consumed by hydra-be.',
  })
  @ApiResponse({ status: 201, description: 'Email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input — validation failed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid internal API key.' })
  sendEmail(@Body() dto: SendEmailDto) {
    return this.service.sendEmail(dto);
  }
}
