import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@apna-ghar/shared-types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If already in standard envelope format, pass through
        if (result && typeof result === 'object' && 'success' in result && result.success === true) {
          return result;
        }

        // Support paginated responses that might return { data: [...], meta: {...} }
        if (result && typeof result === 'object' && 'meta' in result && 'data' in result) {
          return {
            success: true,
            data: result.data,
            meta: result.meta,
          };
        }

        return {
          success: true,
          data: result,
        };
      }),
    );
  }
}
