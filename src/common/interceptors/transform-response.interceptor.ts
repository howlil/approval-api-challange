import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    data : T;
    success: boolean;
    message: string;
}

@Injectable()
export class TransformResponseInterceptor<T> 
    implements NestInterceptor<T, ApiResponse<T>> 
{
    intercept(
        context: ExecutionContext, 
        next: CallHandler
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((value: unknown): ApiResponse<T> => {
                const hasDataShape = 
                value !== null &&
                typeof value === 'object' &&
                'data' in value;

                 if (hasDataShape) {
                    const shaped = value as { data: T,message?: string}
                    return {
                        data: shaped.data,
                        success: true,
                        message: shaped.message ?? 'Request successful',
                    };
                 }
                 return {
                    data: value as T,
                    success: true,
                    message: 'Request successful',
                 };
            }),
        );
    }
}