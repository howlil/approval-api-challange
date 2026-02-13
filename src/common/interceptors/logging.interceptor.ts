import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { type Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, get: getHeader } = request;
    const userAgent = getHeader?.call(request, 'user-agent') ?? '';
    const ip =
      (getHeader?.call(request, 'x-forwarded-for') as string | undefined)?.split(',')[0]?.trim() ??
      request.ip ??
      request.socket?.remoteAddress;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;
          const userId = (request as Request & { user?: { sub?: string } }).user?.sub ?? null;
          this.logRequest(method, url, statusCode, duration, userId, ip, userAgent);
        },
        error: () => {
          const duration = Date.now() - startTime;
          const userId = (request as Request & { user?: { sub?: string } }).user?.sub ?? null;
          this.logRequest(method, url, 500, duration, userId, ip, userAgent, true);
        },
      }),
    );
  }

  private logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId: string | null,
    ip: string | undefined,
    userAgent: string,
    isError = false,
  ): void {
    const parts = [
      `method=${method}`,
      `path=${url}`,
      `status=${statusCode}`,
      `duration=${duration}ms`,
    ];
    if (userId) parts.push(`userId=${userId}`);
    if (ip) parts.push(`ip=${ip}`);
    if (userAgent) parts.push(`ua=${userAgent.slice(0, 60)}${userAgent.length > 60 ? '...' : ''}`);
    const message = parts.join(' ');
    if (isError || statusCode >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }
}
