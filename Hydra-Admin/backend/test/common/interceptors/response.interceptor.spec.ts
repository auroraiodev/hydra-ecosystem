import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';
import { createSuccessResponse } from '../../../src/common/interfaces/api-response.interface';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockContext: Partial<ExecutionContext>;
  let mockHandler: Partial<CallHandler>;

  beforeEach(async () => {
    interceptor = new ResponseInterceptor();

    const mockRequest = {
      apiVersion: { major: 1, minor: 0, patch: 0 },
      requestId: 'test-123',
    };

    const mockResponse = {};

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };

    mockHandler = {
      handle: jest.fn(),
    };
  });

  describe('intercept', () => {
    it('should format plain data response', async () => {
      const testData = { id: 1, name: 'Test' };
      (mockHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const result = await interceptor
        .intercept(mockContext as ExecutionContext, mockHandler as CallHandler)
        .toPromise();

      expect(result).toEqual({
        success: true,
        data: testData,
        meta: {
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: 'test-123',
        },
      });
    });

    it('should handle already formatted response', async () => {
      const formattedData = {
        success: true,
        data: { id: 1 },
        meta: { version: 'v1.0.0' },
      };
      (mockHandler.handle as jest.Mock).mockReturnValue(of(formattedData));

      const result = await interceptor
        .intercept(mockContext as ExecutionContext, mockHandler as CallHandler)
        .toPromise();

      expect(result).toBe(formattedData);
    });

    it('should handle paginated response', async () => {
      const paginatedData = {
        items: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };
      (mockHandler.handle as jest.Mock).mockReturnValue(of(paginatedData));

      const result = await interceptor
        .intercept(mockContext as ExecutionContext, mockHandler as CallHandler)
        .toPromise();

      expect(result).toEqual({
        success: true,
        data: { items: [{ id: 1 }, { id: 2 }] },
        meta: {
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: 'test-123',
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      });
    });

    it('should handle null/undefined data', async () => {
      (mockHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result = await interceptor
        .intercept(mockContext as ExecutionContext, mockHandler as CallHandler)
        .toPromise();

      expect(result).toEqual({
        success: true,
        data: null,
        meta: {
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: 'test-123',
        },
      });
    });
  });
});

describe('createSuccessResponse', () => {
  it('should create properly formatted success response', () => {
    const data = { id: 1, name: 'Test' };
    const version = { major: 1, minor: 0, patch: 0 };

    const result = createSuccessResponse(data, version, { requestId: 'test-123' });

    expect(result).toEqual({
      success: true,
      data,
      meta: {
        version: 'v1.0.0',
        timestamp: expect.any(String),
        requestId: 'test-123',
      },
    });
  });

  it('should handle pagination metadata', () => {
    const data = { items: [] };
    const version = { major: 1, minor: 0, patch: 0 };
    const pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

    const result = createSuccessResponse(data, version, { pagination });

    expect(result.meta!.pagination).toEqual(pagination);
  });
});
