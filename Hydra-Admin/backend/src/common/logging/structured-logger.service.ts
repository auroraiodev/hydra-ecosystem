import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

export interface StructuredLogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  traceId?: string;
  spanId?: string;
  service: string;
  environment: string;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private serviceName = 'hydra-be';
  private environment: string;

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get('NODE_ENV', 'development');
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context?.context,
      traceId: context?.requestId,
      service: this.serviceName,
      environment: this.environment,
      ...context,
    };
  }

  log(message: string, context?: LogContext): void;
  log(message: string, context?: string): void;
  log(message: string, context?: LogContext | string): void {
    const logContext = typeof context === 'string' ? { context } : context || {};
    const entry = this.formatMessage('log', message, logContext);
    this.writeLog(entry);
  }

  error(message: string, trace?: string | Error, context?: LogContext): void;
  error(message: string, trace?: string | Error, context?: string): void;
  error(message: string, trace?: string | Error, context?: LogContext | string): void {
    const logContext = typeof context === 'string' ? { context } : context || {};
    const errorContext =
      trace instanceof Error ? { error: trace, stack: trace.stack } : { stack: trace };

    const entry = this.formatMessage('error', message, { ...logContext, ...errorContext });
    this.writeLog(entry);
  }

  warn(message: string, context?: LogContext): void;
  warn(message: string, context?: string): void;
  warn(message: string, context?: LogContext | string): void {
    const logContext = typeof context === 'string' ? { context } : context || {};
    const entry = this.formatMessage('warn', message, logContext);
    this.writeLog(entry);
  }

  debug(message: string, context?: LogContext): void;
  debug(message: string, context?: string): void;
  debug(message: string, context?: LogContext | string): void {
    if (this.environment === 'production') return; // Skip debug in production

    const logContext = typeof context === 'string' ? { context } : context || {};
    const entry = this.formatMessage('debug', message, logContext);
    this.writeLog(entry);
  }

  verbose(message: string, context?: LogContext): void;
  verbose(message: string, context?: string): void;
  verbose(message: string, context?: LogContext | string): void {
    if (this.environment === 'production') return; // Skip verbose in production

    const logContext = typeof context === 'string' ? { context } : context || {};
    const entry = this.formatMessage('verbose', message, logContext);
    this.writeLog(entry);
  }

  // Helper methods for specific use cases
  logRequest(req: Request, startTime: number): void {
    const duration = Date.now() - startTime;

    this.log('HTTP Request', {
      requestId: (req as any).requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      statusCode: (req as any).statusCode,
      duration,
      context: 'HTTP',
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, error, {
      requestId: context?.requestId,
      method: context?.method,
      url: context?.url,
      userId: context?.userId,
      context: context?.context || 'ERROR',
    });
  }

  logBusinessEvent(event: string, data: any, context?: LogContext): void {
    this.log(`Business Event: ${event}`, {
      event,
      eventData: data,
      ...context,
      context: 'BUSINESS',
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'log' : 'debug';

    this[level](`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
      context: 'PERFORMANCE',
    });
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      securityEvent: event,
      severity,
      ...context,
      context: 'SECURITY',
    });
  }

  private writeLog(entry: StructuredLogEntry): void {
    if (this.environment === 'development') {
      // Development: pretty print to console
      this.consoleLog(entry);
    } else {
      // Production: JSON format for log aggregation
      process.stdout.write(JSON.stringify(entry) + '\n');
    }
  }

  private consoleLog(entry: StructuredLogEntry): void {
    const colors = {
      log: '\x1b[36m', // Cyan
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      debug: '\x1b[35m', // Magenta
      verbose: '\x1b[37m', // White
      reset: '\x1b[0m',
    };

    const color = colors[entry.level] || colors.reset;
    const reset = colors.reset;

    console.log(
      `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}${reset} ` +
        `${entry.requestId ? `[${entry.requestId}] ` : ''}` +
        `${entry.context ? `[${entry.context}] ` : ''}` +
        `${entry.message}`,
    );

    if (entry.error) {
      console.error(entry.error);
    }

    if (Object.keys(entry).length > 6) {
      // More than basic fields
      console.log('Context:', JSON.stringify(entry, null, 2));
    }
  }
}
