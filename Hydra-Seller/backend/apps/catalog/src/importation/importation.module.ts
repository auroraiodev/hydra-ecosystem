import { Module } from '@nestjs/common';
import { ImportationController } from './importation.controller.js';
import { ImportationService } from './importation.service.js';
import { CurrencyService } from './currency.service.js';
import { PrismaModule } from '@hydra/database';

@Module({
  imports: [PrismaModule],
  controllers: [ImportationController],
  providers: [ImportationService, CurrencyService],
  exports: [ImportationService, CurrencyService],
})
export class ImportationModule {}
