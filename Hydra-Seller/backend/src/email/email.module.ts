import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { NotifyClientModule } from '../notify-client/notify-client.module.js';

@Module({
  imports: [NotifyClientModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
