import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSuccessResponse } from '../interfaces/api-response.interface.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Check if the response is already formatted
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Format the response using the standard format
        const formattedResponse = createSuccessResponse(data, request.apiVersion, {
          requestId: request.requestId,
        });

        // Add pagination metadata if present
        if (data && typeof data === 'object' && 'pagination' in data) {
          formattedResponse.meta!.pagination = data.pagination;
          // Remove pagination from the actual data
          const { pagination: _, ...dataWithoutPagination } = data;
          formattedResponse.data = dataWithoutPagination;
        }

        return formattedResponse;
      }),
    );
  }
}
