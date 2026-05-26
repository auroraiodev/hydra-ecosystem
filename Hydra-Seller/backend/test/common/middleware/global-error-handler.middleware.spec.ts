import { GlobalErrorHandlerMiddleware } from '../../../src/common/middleware/global-error-handler.middleware';
import {
  ValidationError,
  NotFoundError,
} from '../../../src/common/interfaces/api-response.interface';
import type { Request, Response } from 'express';

describe('GlobalErrorHandlerMiddleware', () => {
  let middleware: GlobalErrorHandlerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    middleware = new GlobalErrorHandlerMiddleware();
    mockRequest = {
      path: '/test',
      method: 'GET',
      requestId: 'test-123',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('handleError', () => {
    it('should handle StandardError correctly', () => {
      const error = new ValidationError('Test validation error', { field: 'value' });

      middleware['handleError'](error, mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test validation error',
          details: { field: 'value' },
        },
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-123',
          path: '/test',
          method: 'GET',
        },
      });
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('User', '123');

      middleware['handleError'](error, mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User with id 123 not found',
        },
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-123',
          path: '/test',
          method: 'GET',
        },
      });
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');

      middleware['handleError'](error, mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-123',
          path: '/test',
          method: 'GET',
        },
      });
    });

    it('should handle ValidationError by name', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      middleware['handleError'](error, mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-123',
          path: '/test',
          method: 'GET',
        },
      });
    });

    it('should handle CastError correctly', () => {
      const error = new Error('Invalid cast');
      error.name = 'CastError';

      middleware['handleError'](error, mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format',
        },
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-123',
          path: '/test',
          method: 'GET',
        },
      });
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = middleware['generateRequestId']();
      const id2 = middleware['generateRequestId']();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
