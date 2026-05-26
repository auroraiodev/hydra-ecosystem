import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { UploadController } from './upload.controller.js';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminAnalyticsController } from './admin-analytics.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminWalletController } from './admin-wallet.controller.js';
import { AdminSettingsController } from './admin-settings.controller.js';
import { AdminToolsController } from './admin-tools.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { StorageModule } from '../common/storage/storage.module.js';

@Module({
  imports: [NotificationsModule, ChatModule, StorageModule],
  controllers: [
    AdminDashboardController,
    AdminAnalyticsController,
    AdminOrdersController,
    AdminWalletController,
    AdminSettingsController,
    AdminToolsController,
    UploadController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
