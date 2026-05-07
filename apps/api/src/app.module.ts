import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { ClassificationModule } from './modules/classification/classification.module';
import { DeMinimisModule } from './modules/deminimis/deminimis.module';
import { RiskModule } from './modules/risk/risk.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SubstanceModule } from './modules/substance/substance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { BillingModule } from './modules/billing/billing.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 20 },
          { name: 'medium', ttl: 60000, limit: 200 },
          { name: 'long', ttl: 3600000, limit: 2000 },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuditModule,
    AuthModule,
    OrganizationsModule,
    RevenueModule,
    ClassificationModule,
    DeMinimisModule,
    RiskModule,
    AlertsModule,
    SubstanceModule,
    ReportsModule,
    BillingModule,
  ],
  providers: [
    // Rate limiting — must be first so brute-force attacks are blocked before any auth work
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Apply JwtAuthGuard globally — individual controllers can opt out with @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Apply SubscriptionGuard globally — runs after auth, checks subscription status
    { provide: APP_GUARD, useClass: SubscriptionGuard },
  ],
})
export class AppModule {}
