import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../database/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TerminusModule.forRoot({
      logger: false,
    }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class HealthModule {}
