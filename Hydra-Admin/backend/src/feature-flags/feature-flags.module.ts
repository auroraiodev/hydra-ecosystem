import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { FeatureFlagsService } from './feature-flags.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
