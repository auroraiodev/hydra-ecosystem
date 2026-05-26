import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushService } from './push.service.js';

@Module({
  imports: [ConfigModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
