import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { PushService } from './push.service.js';
import { AiBotService } from './ai-bot.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SearchModule } from '../../apps/catalog/src/search/search.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SearchModule,
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
