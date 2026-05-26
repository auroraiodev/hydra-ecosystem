import { Injectable, OnModuleInit } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ConfigService } from '@nestjs/config';
import { Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

@Injectable()
export class OpenTelemetryService implements OnModuleInit {
  private sdk?: InstanceType<typeof NodeSDK>;
  private meterProvider?: InstanceType<typeof MeterProvider>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeTracing();
    this.initializeMetrics();
  }

  private initializeTracing(): void {
    const exporter = new OTLPTraceExporter({
      url: this.configService.get<string>(
        'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
        'http://localhost:4318/v1/traces',
      ),
      headers: {
        'api-key': this.configService.get<string>('HONEYCOMB_API_KEY') || '',
      },
    });

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: 'hydra-be',
        [SemanticResourceAttributes.SERVICE_VERSION]: this.configService.get<string>(
          'APP_VERSION',
          '1.0.0',
        ),
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.configService.get<string>(
          'NODE_ENV',
          'development',
        ),
      }),
      spanProcessor: new BatchSpanProcessor(exporter),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    this.sdk.start();
  }

  private initializeMetrics(): void {
    const metricExporter = new OTLPMetricExporter({
      url: this.configService.get<string>(
        'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
        'http://localhost:4318/v1/metrics',
      ),
      headers: {
        'api-key': this.configService.get<string>('HONEYCOMB_API_KEY') || '',
      },
    });

    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000,
    });

    this.meterProvider = new MeterProvider({
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: 'hydra-be',
        [SemanticResourceAttributes.SERVICE_VERSION]: this.configService.get<string>(
          'APP_VERSION',
          '1.0.0',
        ),
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.configService.get<string>(
          'NODE_ENV',
          'development',
        ),
      }),
      readers: [metricReader],
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
    if (this.meterProvider) {
      await this.meterProvider.shutdown();
    }
  }

  // Helper methods for custom metrics
  createCounter(name: string, description?: string): Counter | undefined {
    return this.meterProvider?.getMeter('hydra-be').createCounter(name, { description });
  }

  createHistogram(name: string, description?: string): Histogram | undefined {
    return this.meterProvider?.getMeter('hydra-be').createHistogram(name, { description });
  }

  createGauge(name: string, description?: string): UpDownCounter | undefined {
    return this.meterProvider?.getMeter('hydra-be').createUpDownCounter(name, { description });
  }
}
