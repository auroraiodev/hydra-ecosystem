import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLogger } from './structured-logger.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StructuredLogger,
      useClass: StructuredLogger,
    },
  ],
  exports: [StructuredLogger],
})
export class LoggingModule {}
