import * as path from 'path';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@hydra/database';
import {
  AppCacheModule,
  ThrottleModule,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiVersioningMiddleware,
} from '@hydra/common';
import { QueueModule } from '@hydra/queue';
import { AuthGuardModule, JwtAuthGuard } from '@hydra/auth';
import { NotifyClientModule } from './notify-client/notify-client.module.js';
import { EmailModule } from './email/email.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(process.cwd(), '.env'),
    }),
    ThrottleModule,
    AppCacheModule,
    QueueModule,
    PrismaModule,
    AuthGuardModule,
    NotifyClientModule,
    EmailModule,
    NotificationsModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class EngageModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiVersioningMiddleware).forRoutes('*');
  }
}
