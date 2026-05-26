import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';
import { SearchModule } from '../../apps/catalog/src/search/search.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, SearchModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
