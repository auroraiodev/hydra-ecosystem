import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { AppCacheModule } from '../common/cache/cache.module.js';
import { UsersModule } from '../users/users.module.js';
import { WalletModule } from '../wallet/wallet.module.js';

@Module({
  imports: [PrismaModule, UsersModule, AppCacheModule, WalletModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
