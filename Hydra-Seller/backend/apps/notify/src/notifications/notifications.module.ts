import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { EmailModule } from '../email/email.module.js';
import { PushModule } from '../push/push.module.js';
import { ApiKeyGuard } from '../common/api-key.guard.js';

@Module({
  imports: [EmailModule, PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ApiKeyGuard],
})
export class NotificationsModule {}
