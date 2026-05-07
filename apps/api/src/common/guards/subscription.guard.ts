import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

export const SKIP_SUBSCRIPTION_CHECK = 'skipSubscriptionCheck';

/** Mark a route to bypass subscription gating */
export const SkipSubscriptionCheck = () =>
  Reflect.metadata(SKIP_SUBSCRIPTION_CHECK, true);

const BLOCKED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.EXPIRED,
  SubscriptionStatus.PAUSED,
];

const ALLOWED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
];

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow routes that explicitly opt out
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_CHECK,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.orgId) return true; // Unauthenticated routes handled by JwtAuthGuard

    // Block unverified users from all platform endpoints
    if (user.emailVerified === false) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before continuing. Check your inbox for the verification link.',
        resendUrl: '/api/v1/auth/resend-verification',
      });
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: user.orgId },
      select: {
        subscriptionStatus: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!org) return true;

    // TRIALING orgs have full access during trial
    if (org.subscriptionStatus === SubscriptionStatus.TRIALING) {
      if (org.currentPeriodEnd && org.currentPeriodEnd > new Date()) {
        return true; // Trial still active
      }
      throw new ForbiddenException({
        code: 'TRIAL_ENDED',
        message: 'Your free trial has ended. Please choose a plan to continue.',
        billingUrl: '/billing',
      });
    }

    // CANCELLED orgs retain access until period end
    if (org.subscriptionStatus === SubscriptionStatus.CANCELLED) {
      if (org.currentPeriodEnd && org.currentPeriodEnd > new Date()) {
        return true; // Still within paid window
      }
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_ENDED',
        message: 'Your subscription has ended. Please renew to continue.',
        billingUrl: '/billing',
      });
    }

    if (BLOCKED_STATUSES.includes(org.subscriptionStatus)) {
      const isExpired = org.subscriptionStatus === SubscriptionStatus.EXPIRED;
      throw new ForbiddenException({
        code: isExpired ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_PAUSED',
        message: isExpired
          ? 'Your subscription has expired. Please renew to restore access.'
          : 'Your subscription is paused. Contact support to resume.',
        billingUrl: '/billing',
      });
    }

    // PAST_DUE: allow 7-day grace period from period end
    if (org.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
      if (org.currentPeriodEnd) {
        const gracePeriodEnd = new Date(org.currentPeriodEnd);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        if (new Date() > gracePeriodEnd) {
          throw new ForbiddenException({
            code: 'GRACE_PERIOD_EXPIRED',
            message: 'Payment overdue — grace period has ended. Please update your payment method.',
            billingUrl: '/billing',
          });
        }
      }
      // Within grace period — allow through with warning (frontend reads the status)
      return true;
    }

    return true;
  }
}
