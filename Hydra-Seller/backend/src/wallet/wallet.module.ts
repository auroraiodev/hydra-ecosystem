import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { PrismaModule } from '../database/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
