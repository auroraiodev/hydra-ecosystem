import { ApiVersioningMiddleware } from '../../../src/common/middleware/api-versioning.middleware';
import type { Request, Response, NextFunction } from 'express';

describe('ApiVersioningMiddleware', () => {
  let middleware: ApiVersioningMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    middleware = new ApiVersioningMiddleware();
    mockRequest = {
      headers: {},
      query: {},
      path: '/api/users',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('use', () => {
    it('should use default version when no version is specified', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.apiVersion).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version from header', () => {
      mockRequest.headers = { 'api-version': '1.0.5' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.apiVersion).toEqual({ major: 1, minor: 0, patch: 5 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version from query parameter', () => {
      mockRequest.query = { v: '1.0.5' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.apiVersion).toEqual({ major: 1, minor: 0, patch: 5 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version from URL path', () => {
      (mockRequest as any).path = '/api/v1/users';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.apiVersion).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle unsupported version', () => {
      mockRequest.headers = { 'api-version': '3.0.0' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unsupported API version',
        message: 'Version v3.0.0 is not supported',
        supportedVersions: ['v1.0.0'],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed version in header', () => {
      mockRequest.headers = { 'api-version': 'invalid' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.apiVersion).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should build versioned path correctly', () => {
      (mockRequest as any).path = '/api/v1/users';
      mockRequest.headers = { 'api-version': '1.0.0' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      // versionedPath strips the original path down to /api + /v{major}
      expect(mockRequest.versionedPath).toBe('/api/users/v1');
    });
  });
});
