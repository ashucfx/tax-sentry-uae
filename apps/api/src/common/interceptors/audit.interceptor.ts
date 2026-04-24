import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    if (!AUDITED_METHODS.includes(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              orgId: user.orgId,
              actorId: user.id,
              actorEmail: user.email,
              action: `${method}:${url}`,
              entity: 'HTTP_REQUEST',
              entityId: url,
              afterJson: responseData ? JSON.parse(JSON.stringify(responseData)) : null,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        } catch {
          // Audit logging must never break the main flow
        }
      }),
    );
  }
}
