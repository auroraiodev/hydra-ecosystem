import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../database/prisma.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthController } from '../../apps/auth/src/auth/auth.controller.js';
import { AuthService } from '../../apps/auth/src/auth/auth.service.js';
import { GoogleStrategy } from '../../apps/auth/src/auth/strategies/google.strategy.js';
import { RefreshTokenService } from '../../apps/auth/src/auth/refresh-token.service.js';
import { PrismaService as AuthPrismaService } from '../../apps/auth/src/database/prisma.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
        },
      }),
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    RefreshTokenService,
    {
      provide: AuthPrismaService,
      useFactory: (prisma: PrismaService) => prisma,
      inject: [PrismaService],
    },
  ],
})
export class GoogleOauthModule {}
