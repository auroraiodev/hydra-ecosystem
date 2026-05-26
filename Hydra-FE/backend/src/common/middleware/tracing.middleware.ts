import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { TracingService } from '../telemetry/tracing.service';

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  constructor(private tracingService: TracingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.tracingService.traceHttp(req, res, next);
  }
}
