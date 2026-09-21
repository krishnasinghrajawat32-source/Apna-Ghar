import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ApiErrorDetail } from '@apnaghar/shared-types';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal server error occurred.';
    let details: ApiErrorDetail[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = exception.name.toUpperCase().replace(/\s+/g, '_');
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        
        // Check if custom envelope already passed
        if (resObj.error && typeof resObj.error === 'object') {
          errorCode = resObj.error.code || errorCode;
          message = resObj.error.message || message;
          details = resObj.error.details;
        } else {
          message = resObj.message ? (Array.isArray(resObj.message) ? resObj.message.join(', ') : resObj.message) : message;
          errorCode = resObj.error ? String(resObj.error).toUpperCase().replace(/\s+/g, '_') : 'HTTP_ERROR';
          
          if (Array.isArray(resObj.message)) {
            details = resObj.message.map((msg: string) => ({
              issue: msg,
            }));
          }
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers['x-request-id'] as string) || undefined,
      },
    };

    response.status(status).json(errorResponse);
  }
}
