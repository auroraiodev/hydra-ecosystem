import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Generate unique request ID if not already present
    if (!req.headers['x-request-id']) {
      (req as any).requestId = this.generateRequestId();
      res.setHeader('X-Request-ID', (req as any).requestId);
    } else {
      (req as any).requestId = req.headers['x-request-id'];
    }

    // Log incoming request
    this.logRequest(req);

    // Skip body buffering for SSE endpoints (streaming responses never end normally)
    const isSse = req.headers.accept === 'text/event-stream' || req.path.includes('/stream');

    if (!isSse) {
      const originalWrite = res.write;
      const originalEnd = res.end;
      const chunks: Buffer[] = [];

      res.write = function (chunk: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.from(chunk));
        return originalWrite.apply(this, [chunk, ...args]);
      };

      const middleware = this;
      res.end = function (this: Response, chunk?: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.from(chunk));
        const duration = Date.now() - startTime;
        const body = Buffer.concat(chunks).toString('utf8');

        // Log response
        const logData: any = {
          requestId: (req as any).requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          contentLength: this.get('Content-Length'),
        };

        if (res.statusCode === 400) {
          try {
            logData.responseBody = JSON.parse(body);
          } catch {
            logData.responseBody = body;
          }
        }

        middleware.logger.log(
          `HTTP Response - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
        );

        return originalEnd.apply(this, [chunk, ...args]);
      };
    }

    // Track response completion for async scenarios
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.logger.log(
        `Request completed - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
        {
          requestId: (req as any).requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          completed: true,
        },
      );
    });

    next();
  }

  private sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      'token',
      'password',
      'secret',
      'key',
      '__sid',
      'access_token',
      'refresh_token',
      'authorization',
    ];
    return Object.fromEntries(
      Object.entries(query).map(([k, v]) =>
        sensitiveKeys.some((s) => k.toLowerCase().includes(s)) ? [k, '[REDACTED]'] : [k, v],
      ),
    );
  }

  private logRequest(req: Request): void {
    const { method, path, query: _query, body: _body, headers: _headers, ip: _ip } = req;

    this.logger.log(`Incoming Request: ${method} ${path}`);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
