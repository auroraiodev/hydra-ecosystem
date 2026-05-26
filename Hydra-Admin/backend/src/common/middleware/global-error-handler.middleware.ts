import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { StandardError } from '../interfaces/api-response.interface.js';

@Injectable()
export class GlobalErrorHandlerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate unique request ID for tracking
    req.requestId = this.generateRequestId();

    // Override the default error handler
    res.onError = (error: Error) => {
      this.handleError(error, req, res);
    };

    next();
  }

  private handleError(error: Error, req: Request, res: Response): void {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (error instanceof StandardError) {
      statusCode = error.statusCode;
      errorCode = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof HttpException) {
      statusCode = error.getStatus();
      const response = error.getResponse();

      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        details = (response as any).details || details;
      } else {
        message = response as string;
      }

      errorCode = this.getErrorCodeFromStatus(statusCode);
    } else if (error.name === 'ValidationError') {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      message = error.message;
    } else if (error.name === 'CastError') {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_ID';
      message = 'Invalid ID format';
    }

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      },
    };

    res.status(statusCode).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusToCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusToCodeMap[status] || 'UNKNOWN_ERROR';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
    interface Response {
      onError?: (error: Error) => void;
    }
  }
}
