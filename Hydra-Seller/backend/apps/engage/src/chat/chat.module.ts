import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@hydra/database';
import { AuthGuardModule } from '@hydra/auth';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { PushService } from './push.service.js';
import { AiBotService } from './ai-bot.service.js';
import { EmailModule } from '../email/email.module.js';
import { CatalogSearchModule } from '../catalog/catalog-search.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthGuardModule,
    CatalogSearchModule,
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatService, PushService, AiBotService],
  controllers: [ChatController],
  exports: [ChatService, PushService, ChatGateway],
})
export class ChatModule {}
