import { Module } from '@nestjs/common';
import { HibpService } from './hibp.service.js';

@Module({
  providers: [HibpService],
  exports: [HibpService],
})
export class HibpModule {}
