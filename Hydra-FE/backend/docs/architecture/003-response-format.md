# ADR-003: Consistent API Response Format

## Status
Accepted

## Context
The initial API implementation had inconsistent response formats across different endpoints. Some returned plain data, others had different wrapper objects, and metadata like pagination was handled differently. This inconsistency made it difficult for client applications to handle responses predictably and implement features like global error handling, loading states, and response caching.

Additionally, the lack of a standard format made it challenging to implement proper API documentation, client SDKs, and automated testing.

## Decision
We will implement a consistent API response format for all endpoints with the following characteristics:

### Standard Response Format
All successful responses will follow this structure:
```json
{
  "success": true,
  "data": { ... }, // The actual response data
  "meta": {
    "version": "v1.0.0",
    "timestamp": "2024-01-06T10:00:00.000Z",
    "requestId": "req_1234567890_abc123",
    "pagination": { // Optional for paginated endpoints
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response Format
All error responses will follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... } // Optional additional context
  },
  "meta": {
    "version": "v1.0.0",
    "timestamp": "2024-01-06T10:00:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Implementation Strategy
1. **Response Interceptor**: Automatically formats all responses
2. **Helper Functions**: Utilities for creating formatted responses
3. **Type Definitions**: TypeScript interfaces for response types
4. **Pagination Support**: Standardized pagination metadata
5. **Request Tracking**: Unique request IDs for debugging

### Special Cases
- **File Downloads**: Binary responses bypass formatting
- **Streaming Responses**: Real-time data may use different format
- **Health Checks**: Simple status responses may be minimal
- **Webhooks**: External system callbacks may use custom format

## Consequences

### Positive
- **Consistency**: All responses have predictable format
- **Client Experience**: Easier to implement client-side handling
- **Debugging**: Request tracking and metadata aid troubleshooting
- **Documentation**: Clear, documented response structure
- **Type Safety**: TypeScript interfaces ensure correctness
- **Monitoring**: Easy to track response patterns and performance

### Negative
- **Response Size**: Additional metadata increases response size
- **Processing Overhead**: Extra formatting step for all responses
- **Learning Curve**: Developers need to understand response format
- **Backward Compatibility**: Existing clients may need updates

### Risks
- **Performance Impact**: Additional processing for all responses
- **Overhead**: Small responses may have significant relative overhead
- **Complexity**: More complex than returning raw data
- **Migration**: Existing API consumers need to adapt

## Implementation

The consistent response format is implemented through:

1. **ResponseInterceptor**: Automatically formats all successful responses
2. **createSuccessResponse()**: Helper function for manual formatting
3. **ApiResponse Interface**: TypeScript type definitions
4. **Pagination Metadata**: Standardized pagination information
5. **Request ID Tracking**: Unique identifiers for response correlation

## Usage Examples

```typescript
// Automatic formatting in controllers
@Get('users')
async getUsers() {
  return await this.usersService.findAll(); // Automatically formatted
}

// Manual formatting when needed
@Get('users/:id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findById(id);
  return createSuccessResponse(user, this.request.apiVersion);
}

// Paginated responses
@Get('products')
async getProducts(@Query() query: ProductQuery) {
  const result = await this.productsService.findAll(query);
  return createSuccessResponse(result.items, this.request.apiVersion, {
    pagination: result.pagination,
  });
}
```

## Client Implementation Guide

### JavaScript/TypeScript Client
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}

// Generic API client
class ApiClient {
  async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);
    const formatted: ApiResponse<T> = await response.json();
    
    if (!formatted.success) {
      throw new ApiError(formatted.error!);
    }
    
    return formatted.data!;
  }
}
```

## References
- [JSON API Specification](https://jsonapi.org/)
- [Microsoft REST API Guidelines](https://github.com/Microsoft/api-guidelines/blob/vNext/Guidelines.md#13-response-formats)
- [Google Cloud API Design Guide](https://cloud.google.com/apis/design/design_patterns#resource-oriented_design)