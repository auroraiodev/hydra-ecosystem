import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotifyClientService } from './notify-client.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [NotifyClientService],
  exports: [NotifyClientService],
})
export class NotifyClientModule {}
