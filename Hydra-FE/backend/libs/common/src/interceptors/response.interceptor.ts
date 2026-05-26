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
        if (data && typeof data === 'object' && 'success' in data) return data;

        const formattedResponse = createSuccessResponse(data, request.apiVersion, {
          requestId: request.requestId,
        });

        if (data && typeof data === 'object' && 'pagination' in data) {
          formattedResponse.meta!.pagination = data.pagination;
          const { pagination: _, ...dataWithoutPagination } = data;
          formattedResponse.data = dataWithoutPagination;
        }

        return formattedResponse;
      }),
    );
  }
}
