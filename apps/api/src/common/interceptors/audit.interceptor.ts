import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../../modules/prisma/prisma.service';

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    if (!AUDITED_METHODS.includes(method) || !user) {
      return next.handle();
    }

    const reqBody = request.body ? JSON.parse(JSON.stringify(request.body)) : null;

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                orgId: user.orgId,
                actorId: user.id,
                actorEmail: user.email,
                action: `${method}:${url}`,
                entity: 'HTTP_REQUEST',
                entityId: url,
                beforeJson: reqBody,
                afterJson: responseData ? JSON.parse(JSON.stringify(responseData)) : null,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              },
            });
          } catch (err) {
            this.logger.error(
              `Audit log write FAILED for ${method}:${url} actor=${user.id} — ${(err as Error).message}`,
              (err as Error).stack,
            );
            Sentry.captureException(err, {
              tags: { component: 'AuditInterceptor', method, url },
              user: { id: user.id, email: user.email },
            });
          }
        },
        error: async (err) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                orgId: user.orgId,
                actorId: user.id,
                actorEmail: user.email,
                action: `${method}:${url}`,
                entity: 'HTTP_ERROR',
                entityId: url,
                beforeJson: reqBody,
                afterJson: { error: err.message, status: err.status },
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              },
            });
          } catch (auditErr) {
            this.logger.error(
              `Audit error-log write FAILED for ${method}:${url} actor=${user.id} — ${(auditErr as Error).message}`,
            );
            Sentry.captureException(auditErr, {
              tags: { component: 'AuditInterceptor', method, url },
            });
          }
        },
      }),
    );
  }
}
