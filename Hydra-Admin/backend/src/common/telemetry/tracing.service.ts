import { Injectable } from '@nestjs/common';
import { OpenTelemetryService } from './opentelemetry.service';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  constructor(private openTelemetryService: OpenTelemetryService) {}

  createSpan(name: string, operation: string, attributes: Record<string, any> = {}) {
    const tracer = trace.getTracer('hydra-be');

    return tracer.startSpan(`${name}.${operation}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'service.name': 'hydra-be',
        'operation.type': operation,
        ...attributes,
      },
    });
  }

  async traceAsync<T>(
    name: string,
    operation: string,
    fn: (span: any) => Promise<T>,
    attributes: Record<string, any> = {},
  ): Promise<T> {
    const span = this.createSpan(name, operation, attributes);
    const startTime = Date.now();

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({
        'operation.success': true,
        'operation.duration': Date.now() - startTime,
      });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.setAttributes({
        'operation.success': false,
        'operation.error': error.message,
        'operation.duration': Date.now() - startTime,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  traceHttp(req: any, res: any, next: any) {
    const span = this.createSpan('http', 'request', {
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.headers['user-agent'],
      'http.remote_addr': req.ip,
    });
    const startTime = Date.now();

    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'operation.duration': Date.now() - startTime,
      });

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
      originalEnd.apply(this, args);
    };

    next();
  }

  traceDatabase(query: string, duration: number, success: boolean) {
    const span = this.createSpan('database', 'query', {
      'db.query': query,
      'db.query.duration': duration,
      'db.query.success': success,
    });

    span.setStatus({
      code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
    });

    span.end();
  }

  traceCache(operation: string, key: string, hit: boolean) {
    const span = this.createSpan('cache', operation, {
      'cache.key': key,
      'cache.hit': hit,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  traceBusinessEvent(event: string, data: any) {
    const span = this.createSpan('business', event, {
      'business.event': event,
      'business.data': JSON.stringify(data),
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  // Custom decorators for automatic tracing
  static createTraceDecorator(operation: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const className = target.constructor.name;
        const methodName = propertyName;

        // Ensure tracingService is available on the instance
        if (!this.tracingService) {
          // Fallback or error if not injected
          console.warn(`TracingService not injected in ${className}`);
          return method.apply(this, args);
        }

        return this.tracingService.traceAsync(
          className,
          operation || methodName,
          () => method.apply(this, args),
          {
            'class.name': className,
            'method.name': methodName,
            'method.args': JSON.stringify(args).slice(0, 1000), // Limit size
          },
        );
      };

      return descriptor;
    };
  }
}

// Custom decorator for easy tracing
export const Trace = (operation?: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    return TracingService.createTraceDecorator(operation || propertyName)(
      target,
      propertyName,
      descriptor,
    );
  };
};
