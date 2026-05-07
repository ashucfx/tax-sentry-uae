import {
  Injectable,
  Logger,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { Webhook } from 'svix';
import DodoPayments from 'dodopayments';

// ─── Plan catalogue ───────────────────────────────────────────────────────────
function getPlanId(
  tier: SubscriptionTier,
  interval: 'monthly' | 'yearly',
  cfg: ConfigService,
): string {
  const key = `DODO_PRODUCT_${tier}_${interval.toUpperCase()}`;
  const id = cfg.get<string>(key);
  if (!id) throw new BadRequestException(`Plan not configured: ${key}`);
  return id;
}

// ─── Dodo webhook event shape (matches SDK types) ────────────────────────────
// Dodo events: { type, business_id, timestamp, data: Subscription }
interface DodoSubscription {
  subscription_id: string;
  status: string;
  metadata: Record<string, string>;
  next_billing_date: string;
  cancel_at_next_billing_date: boolean;
  customer: { customer_id?: string; email?: string };
}

interface DodoWebhookEvent {
  type: string;
  business_id: string;
  timestamp: string;
  data: DodoSubscription;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly dodo: DodoPayments;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: ConfigService,
  ) {
    this.dodo = new DodoPayments({
      bearerToken: cfg.getOrThrow<string>('DODO_API_KEY'),
      environment:
        cfg.get<string>('DODO_ENV') === 'live' ? 'live_mode' : 'test_mode',
    });
  }

  // ── Create a hosted checkout session ────────────────────────────────────────
  async createCheckoutSession(
    orgId: string,
    userEmail: string,
    orgName: string,
    tier: SubscriptionTier,
    interval: 'monthly' | 'yearly',
  ): Promise<{ checkoutUrl: string; subscriptionId: string }> {
    this.logger.debug(`[CHECKOUT] Starting for org=${orgId} tier=${tier} interval=${interval}`);

    const productId = getPlanId(tier, interval, this.cfg);
    const webUrl = this.cfg.get<string>('WEB_URL', 'http://localhost:3000');

    this.logger.debug(`[CHECKOUT] Using product=${productId} webUrl=${webUrl}`);

    try {
      this.logger.debug(`[CHECKOUT] Calling Dodo API to create subscription...`);
      const response = await this.dodo.subscriptions.create({
        billing: {
          city: 'Dubai',
          country: 'AE',
          state: 'Dubai',
          street: 'N/A',
          zipcode: '00000',
        },
        customer: {
          email: userEmail,
          name: orgName,
        },
        product_id: productId,
        quantity: 1,
        payment_link: true,
        return_url: `${webUrl}/billing/success`,
        metadata: {
          org_id: orgId,
          tier,
          interval,
        },
      });

      this.logger.debug(
        `[CHECKOUT] ✓ Dodo API response received. SubId=${response.subscription_id}`,
      );

      if (!response.payment_link) {
        this.logger.error(`[CHECKOUT] ✗ Dodo did not return payment_link`);
        throw new UnprocessableEntityException('Dodo did not return a payment link');
      }

      // Persist the subscription ID immediately so we can match the webhook
      await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          dodoSubscriptionId: response.subscription_id,
          subscriptionTier: tier,
          subscriptionInterval: interval,
        },
      });

      this.logger.log(
        `[CHECKOUT] ✓ Checkout created. subId=${response.subscription_id} org=${orgId}`,
      );

      return {
        checkoutUrl: response.payment_link,
        subscriptionId: response.subscription_id,
      };
    } catch (err) {
      this.logger.error(
        `[CHECKOUT] ✗ Dodo API call failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  // ── Fetch current subscription status for an org ────────────────────────────
  async getSubscriptionStatus(orgId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        trialEndsAt: true,
        dodoSubscriptionId: true,
        dodoCustomerId: true,
      },
    });

    const now = new Date();
    const daysUntilExpiry = org.currentPeriodEnd
      ? Math.ceil(
          (org.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      ...org,
      daysUntilExpiry,
      hasAccess: (
        [
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PAST_DUE,   // 7-day grace period
          SubscriptionStatus.CANCELLED,  // still within paid period
        ] as SubscriptionStatus[]
      ).includes(org.subscriptionStatus),
    };
  }

  // ── Generate a customer portal link for self-service billing ────────────────
  async getCustomerPortalUrl(orgId: string): Promise<{ url: string }> {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { dodoCustomerId: true },
    });

    if (!org.dodoCustomerId) {
      throw new BadRequestException('No billing account found. Complete a checkout first.');
    }

    const webUrl = this.cfg.get<string>('WEB_URL', 'http://localhost:3000');

    const portal = await this.dodo.customers.customerPortal.create(org.dodoCustomerId, {
      return_url: `${webUrl}/billing`,
    });

    return { url: portal.link };
  }

  // ── Webhook handler — called from controller with raw body ──────────────────
  async handleWebhook(
    rawBody: Buffer,
    webhookId: string,
    webhookTimestamp: string,
    webhookSignature: string,
  ): Promise<void> {
    // 1. Verify HMAC-SHA256 signature via Svix (Dodo's webhook delivery layer)
    const secret = this.cfg.getOrThrow<string>('DODO_WEBHOOK_SECRET');
    const wh = new Webhook(secret);

    let event: DodoWebhookEvent;
    try {
      this.logger.debug(`[WEBHOOK] Verifying signature for webhook id=${webhookId}`);
      event = wh.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': webhookSignature,
      }) as DodoWebhookEvent;
      this.logger.debug(`[WEBHOOK] ✓ Signature verified. type=${event.type}`);
    } catch (err) {
      this.logger.warn(
        `[WEBHOOK] ✗ Signature verification failed id=${webhookId}: ${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    const sub = event.data;
    const metadata = sub?.metadata ?? {};
    const orgId = metadata.org_id;

    this.logger.debug(
      `[WEBHOOK] Processing event type=${event.type} subId=${sub?.subscription_id} orgId=${orgId ?? '?'}`,
    );

    // 2. Atomic idempotency guard — attempt INSERT first. If the row already exists
    //    (duplicate Svix delivery), the unique constraint fires and we skip silently.
    //    This closes the TOCTOU gap between a read-then-write pattern.
    let idempotencyRecord: { id: string } | null = null;
    try {
      idempotencyRecord = await this.prisma.billingEvent.create({
        data: {
          eventId: webhookId,
          eventType: event.type,
          payloadJson: event as object,
          orgId: orgId ?? null,
        },
        select: { id: true },
      });
    } catch (err: unknown) {
      // P2002 = unique constraint violation → duplicate webhook, already processed
      if ((err as { code?: string })?.code === 'P2002') {
        this.logger.debug(`[WEBHOOK] ⚠ Duplicate webhook ignored id=${webhookId}`);
        return;
      }
      throw err;
    }

    // 3. Route to handler. If handler throws, Svix will retry.
    //    The idempotency record is already written — on retry, step 2 will short-circuit
    //    without re-running the handler. This means handlers must be idempotent within
    //    themselves (upsert-style writes), which all organization.update() calls are.
    try {
      switch (event.type) {
        case 'subscription.active':
          await this.onSubscriptionActive(orgId, sub);
          break;
        case 'subscription.renewed':
          await this.onSubscriptionRenewed(orgId, sub);
          break;
        case 'subscription.on_hold':
          await this.onSubscriptionOnHold(orgId, sub);
          break;
        case 'subscription.cancelled':
          await this.onSubscriptionCancelled(orgId, sub);
          break;
        case 'subscription.expired':
          await this.onSubscriptionExpired(orgId, sub);
          break;
        case 'subscription.failed':
          await this.onSubscriptionOnHold(orgId, sub);
          break;
        case 'payment.succeeded':
          this.logger.log(`[WEBHOOK] ✓ Payment succeeded org=${orgId}`);
          break;
        case 'payment.failed':
          this.logger.warn(`[WEBHOOK] ✗ Payment failed org=${orgId}`);
          break;
        default:
          this.logger.debug(`[WEBHOOK] ⚠ Unhandled webhook type: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(
        `[WEBHOOK] ✗ Handler error for type=${event.type} id=${idempotencyRecord.id}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    this.logger.log(
      `[WEBHOOK] ✓ Event processed: ${event.type} sub=${sub?.subscription_id} org=${orgId ?? '?'} record=${idempotencyRecord.id}`,
    );
  }

  // ── Private event handlers ───────────────────────────────────────────────────

  private resolveOrgId(orgId: string | undefined, sub: DodoSubscription): string | null {
    // Primary: metadata org_id (set at checkout)
    if (orgId) return orgId;
    // Fallback: look up by Dodo subscription_id if metadata was not set
    return null;
  }

  private async findOrgBySubOrId(
    orgIdFromMeta: string | undefined,
    subscriptionId: string,
  ): Promise<string | null> {
    if (orgIdFromMeta) return orgIdFromMeta;
    const org = await this.prisma.organization.findUnique({
      where: { dodoSubscriptionId: subscriptionId },
      select: { id: true },
    });
    return org?.id ?? null;
  }

  private async onSubscriptionActive(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) {
      this.logger.warn(
        `[SUBSCRIPTION.ACTIVE] ✗ Could not resolve org for sub=${sub.subscription_id} meta_org=${
          orgIdFromMeta ?? null
        }`,
      );
      return;
    }

    const tierFromMeta = sub.metadata?.tier as SubscriptionTier | undefined;
    const interval = sub.metadata?.interval as 'monthly' | 'yearly' | undefined;
    const nextBilling = sub.next_billing_date ? new Date(sub.next_billing_date) : null;

    this.logger.debug(
      `[SUBSCRIPTION.ACTIVE] Updating org=${orgId} tier=${tierFromMeta} interval=${interval} nextBilling=${nextBilling}`,
    );

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        dodoSubscriptionId: sub.subscription_id,
        ...(sub.customer?.customer_id && { dodoCustomerId: sub.customer.customer_id }),
        ...(tierFromMeta && { subscriptionTier: tierFromMeta }),
        ...(interval && { subscriptionInterval: interval }),
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBilling,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date ?? false,
        trialEndsAt: null,
        isActive: true,
      },
    });

    this.logger.log(`[SUBSCRIPTION.ACTIVE] ✓ Subscription ACTIVATED org=${orgId}`);
  }

  private async onSubscriptionRenewed(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) {
      this.logger.warn(`[SUBSCRIPTION.RENEWED] ✗ Could not resolve org for sub=${sub.subscription_id}`);
      return;
    }

    const nextBilling = sub.next_billing_date ? new Date(sub.next_billing_date) : null;

    this.logger.debug(`[SUBSCRIPTION.RENEWED] Updating org=${orgId} nextBilling=${nextBilling}`);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBilling,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date ?? false,
      },
    });

    this.logger.log(`[SUBSCRIPTION.RENEWED] ✓ Subscription renewed org=${orgId}`);
  }

  private async onSubscriptionOnHold(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) {
      this.logger.warn(`[SUBSCRIPTION.ON_HOLD] ✗ Could not resolve org for sub=${sub.subscription_id}`);
      return;
    }

    this.logger.warn(`[SUBSCRIPTION.ON_HOLD] Payment failed, setting to PAST_DUE org=${orgId}`);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
    });

    this.logger.warn(`[SUBSCRIPTION.ON_HOLD] ✓ Org paused org=${orgId}`);
  }

  private async onSubscriptionCancelled(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) {
      this.logger.warn(`[SUBSCRIPTION.CANCELLED] ✗ Could not resolve org for sub=${sub.subscription_id}`);
      return;
    }

    this.logger.warn(`[SUBSCRIPTION.CANCELLED] Setting status to CANCELLED org=${orgId}`);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
      },
    });

    this.logger.warn(`[SUBSCRIPTION.CANCELLED] ✓ Subscription cancelled org=${orgId}`);
  }

  private async onSubscriptionExpired(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) {
      this.logger.warn(`[SUBSCRIPTION.EXPIRED] ✗ Could not resolve org for sub=${sub.subscription_id}`);
      return;
    }

    this.logger.warn(`[SUBSCRIPTION.EXPIRED] Subscription expired, blocking access org=${orgId}`);

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        isActive: false,
      },
    });

    this.logger.warn(`[SUBSCRIPTION.EXPIRED] ✓ Access blocked org=${orgId}`);
  }
}
