import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { FeatureFlagsService } from './feature-flags.service.js';
import { MaintenanceGuard } from './maintenance.guard.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable is required');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return { secret, signOptions: { expiresIn: expiresIn as any } };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, MaintenanceGuard],
  exports: [FeatureFlagsService, MaintenanceGuard],
})
export class FeatureFlagsModule {}
