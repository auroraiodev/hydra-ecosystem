import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { HibpModule } from '../common/hibp/hibp.module.js';

@Module({
  imports: [PrismaModule, HibpModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
