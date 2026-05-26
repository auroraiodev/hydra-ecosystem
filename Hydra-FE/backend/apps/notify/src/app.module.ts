import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module.js';
import { EmailModule } from './email/email.module.js';
import { PushModule } from './push/push.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: path.join(process.cwd(), '.env') }),
    PrismaModule,
    EmailModule,
    PushModule,
    NotificationsModule,
  ],
  controllers: [],
})
export class AppModule {}
