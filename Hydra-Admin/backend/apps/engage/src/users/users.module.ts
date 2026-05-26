import { Module } from '@nestjs/common';
import { PrismaModule } from '@hydra/database';
import { UsersService } from './users.service.js';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
