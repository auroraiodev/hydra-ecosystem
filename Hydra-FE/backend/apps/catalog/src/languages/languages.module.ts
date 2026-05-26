import { Module } from '@nestjs/common';
import { LanguagesService } from './languages.service.js';
import { LanguagesController } from './languages.controller.js';
import { PrismaModule } from '@hydra/database';

@Module({
  imports: [PrismaModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
