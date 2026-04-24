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
    const productId = getPlanId(tier, interval, this.cfg);
    const webUrl = this.cfg.get<string>('WEB_URL', 'http://localhost:3000');

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
        // Uses CreateNewCustomer union variant — no customer_id yet
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

    if (!response.payment_link) {
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

    this.logger.log(`Checkout created for org=${orgId} tier=${tier} interval=${interval}`);

    return {
      checkoutUrl: response.payment_link,
      subscriptionId: response.subscription_id,
    };
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
      event = wh.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': webhookSignature,
      }) as DodoWebhookEvent;
    } catch {
      this.logger.warn(`Webhook sig verification failed id=${webhookId}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Idempotency — skip if already processed (Svix may retry on non-200)
    const alreadyProcessed = await this.prisma.billingEvent.findUnique({
      where: { eventId: webhookId },
    });
    if (alreadyProcessed) {
      this.logger.debug(`Duplicate webhook ignored: ${webhookId}`);
      return;
    }

    const sub = event.data;
    const metadata = sub?.metadata ?? {};
    const orgId = metadata.org_id;

    // 3. Persist raw event for audit trail (regardless of outcome)
    await this.prisma.billingEvent.create({
      data: {
        eventId: webhookId,
        eventType: event.type,
        payloadJson: event as object,
        orgId: orgId ?? null,
      },
    });

    this.logger.log(`Webhook: ${event.type} sub=${sub?.subscription_id} org=${orgId ?? '?'}`);

    // 4. Route to handler
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
        await this.onSubscriptionOnHold(orgId, sub); // treat same as on_hold
        break;

      case 'payment.succeeded':
        this.logger.log(`Payment succeeded for org=${orgId}`);
        break;

      case 'payment.failed':
        this.logger.warn(`Payment failed for org=${orgId}`);
        break;

      default:
        this.logger.debug(`Unhandled webhook type: ${event.type}`);
    }
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
      this.logger.warn(`subscription.active — could not resolve org for sub=${sub.subscription_id}`);
      return;
    }

    const tierFromMeta = sub.metadata?.tier as SubscriptionTier | undefined;
    const interval = sub.metadata?.interval as 'monthly' | 'yearly' | undefined;
    const nextBilling = sub.next_billing_date ? new Date(sub.next_billing_date) : null;

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

    this.logger.log(`Subscription ACTIVATED: org=${orgId}`);
  }

  private async onSubscriptionRenewed(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) return;

    const nextBilling = sub.next_billing_date ? new Date(sub.next_billing_date) : null;

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBilling,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date ?? false,
      },
    });

    this.logger.log(`Subscription RENEWED: org=${orgId} nextBilling=${nextBilling}`);
  }

  private async onSubscriptionOnHold(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) return;

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
    });

    this.logger.warn(`Subscription ON HOLD (payment failed): org=${orgId}`);
  }

  private async onSubscriptionCancelled(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) return;

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        // Access continues until currentPeriodEnd — handled by SubscriptionGuard
      },
    });

    this.logger.log(`Subscription CANCELLED: org=${orgId} (access until period end)`);
  }

  private async onSubscriptionExpired(
    orgIdFromMeta: string | undefined,
    sub: DodoSubscription,
  ) {
    const orgId = await this.findOrgBySubOrId(orgIdFromMeta, sub.subscription_id);
    if (!orgId) return;

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        isActive: false,
      },
    });

    this.logger.warn(`Subscription EXPIRED — access blocked: org=${orgId}`);
  }
}
