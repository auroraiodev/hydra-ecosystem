import { Module } from '@nestjs/common';
import { SearchClientService } from './search-client.service.js';

@Module({
  providers: [SearchClientService],
  exports: [SearchClientService],
})
export class SearchClientModule {}
