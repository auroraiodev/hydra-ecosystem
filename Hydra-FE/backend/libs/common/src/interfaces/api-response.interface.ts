import { ApiVersion } from '../middleware/api-versioning.middleware.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: any };
  meta?: {
    version: string;
    timestamp: string;
    requestId?: string;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class StandardError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'StandardError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends StandardError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends StandardError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends StandardError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends StandardError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends StandardError {
  constructor(message: string, details?: any) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
  }
}

const DEFAULT_VERSION: ApiVersion = { major: 1, minor: 0, patch: 0 };

export const createSuccessResponse = <T>(
  data: T,
  version: ApiVersion = DEFAULT_VERSION,
  meta?: Partial<ApiResponse<T>['meta']>,
): ApiResponse<T> => {
  const v = version || DEFAULT_VERSION;
  return {
    success: true,
    data,
    meta: {
      version: `v${v.major}.${v.minor}.${v.patch}`,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
};

export const createErrorResponse = (
  error: StandardError,
  version: ApiVersion = DEFAULT_VERSION,
  requestId?: string,
): ApiResponse => {
  const v = version || DEFAULT_VERSION;
  return {
    success: false,
    error: { code: error.code, message: error.message, details: error.details },
    meta: {
      version: `v${v.major}.${v.minor}.${v.patch}`,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
};
