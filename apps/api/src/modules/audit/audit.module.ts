import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor],
})
export class AuditModule {}
