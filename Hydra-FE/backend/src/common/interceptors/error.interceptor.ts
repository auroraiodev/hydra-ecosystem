import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StandardError, createErrorResponse } from '../interfaces/api-response.interface.js';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((error) => {
        // Handle the error and format the response
        if (error instanceof StandardError) {
          const errorResponse = createErrorResponse(error, request.apiVersion, request.requestId);
          response.status(error.statusCode).json(errorResponse);
        } else {
          // Let the global error handler middleware deal with other errors
          throw error;
        }

        // Return an empty observable to prevent further processing
        return new Observable(() => {});
      }),
    );
  }
}
