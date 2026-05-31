import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const req = context.switchToHttp().getRequest();
        const isWebhook = req.url && req.url.includes('/webhook');
        
        // Only report 500s, unhandled exceptions, OR any failure in webhooks to Sentry
        if (!error.status || error.status >= 500 || isWebhook) {
          Sentry.withScope((scope) => {
            // Attach Request Context
            scope.setTag('path', req.url);
            scope.setTag('method', req.method);
            if (isWebhook) {
              scope.setTag('context', 'webhook');
            }
            if (req.user) {
              scope.setUser({ id: req.user.id, email: req.user.email });
              scope.setTag('orgId', req.user.orgId);
            }
            
            Sentry.captureException(error);
          });
          
          console.error(`[Sentry] Captured Exception on ${req.method} ${req.url}:`, error.message);
        }
        
        return throwError(() => error);
      }),
    );
  }
}
