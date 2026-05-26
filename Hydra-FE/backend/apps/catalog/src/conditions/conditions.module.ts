import { Module } from '@nestjs/common';
import { ConditionsService } from './conditions.service.js';
import { ConditionsController } from './conditions.controller.js';
import { PrismaModule } from '@hydra/database';

@Module({
  imports: [PrismaModule],
  controllers: [ConditionsController],
  providers: [ConditionsService],
  exports: [ConditionsService],
})
export class ConditionsModule {}
