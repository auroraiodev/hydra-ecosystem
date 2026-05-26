import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenTelemetryService } from './opentelemetry.service';
import { TracingService } from './tracing.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenTelemetryService, TracingService],
  exports: [OpenTelemetryService, TracingService],
})
export class TelemetryModule {}
