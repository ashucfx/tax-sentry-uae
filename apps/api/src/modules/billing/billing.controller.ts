import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';
import { FastifyRequest, FastifyReply } from 'fastify';

interface JwtUser {
  sub: string;
  orgId: string;
  email: string;
  role: string;
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  // ── POST /billing/checkout ─────────────────────────────────────────────────
  // Returns a Dodo-hosted checkout URL. Frontend redirects the user to it.
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a hosted checkout session' })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: JwtUser,
    @Req() req: FastifyRequest,
  ) {
    this.logger.debug(
      `[CHECKOUT] Initiating checkout for org=${user.orgId} tier=${dto.tier} interval=${dto.interval}`,
    );

    // Fetch org name for Dodo customer record
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: user.orgId },
      select: { name: true },
    });

    try {
      const result = await this.billingService.createCheckoutSession(
        user.orgId,
        user.email,
        org.name,
        dto.tier,
        dto.interval,
      );

      this.logger.log(
        `[CHECKOUT] ✓ Checkout created. SubId=${result.subscriptionId} user=${user.email}`,
      );

      return { data: result };
    } catch (err) {
      this.logger.error(
        `[CHECKOUT] ✗ Failed to create checkout: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  // ── GET /billing/status ────────────────────────────────────────────────────
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription status for the current org' })
  async getStatus(@CurrentUser() user: JwtUser) {
    const status = await this.billingService.getSubscriptionStatus(user.orgId);
    return { data: status };
  }

  // ── GET /billing/portal ────────────────────────────────────────────────────
  // Redirect user to Dodo's self-service billing portal
  @Get('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer portal URL (upgrade/cancel/invoices)' })
  async getPortal(@CurrentUser() user: JwtUser) {
    const result = await this.billingService.getCustomerPortalUrl(user.orgId);
    return { data: result };
  }

  // ── POST /billing/webhook ──────────────────────────────────────────────────
  // Dodo/Svix webhook receiver. NO auth guard — verified by HMAC signature.
  // Fastify rawbody plugin must be registered in main.ts for this to work.
  @Post('webhook')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dodo Payments webhook receiver (internal)' })
  async handleWebhook(
    @Req() req: FastifyRequest & { rawBody?: Buffer },
    @Res({ passthrough: true }) _res: FastifyReply,
    @Headers('webhook-id') webhookId: string,
    @Headers('webhook-timestamp') webhookTimestamp: string,
    @Headers('webhook-signature') webhookSignature: string,
  ) {
    const rawBody: Buffer | undefined = (req as any).rawBody;

    this.logger.debug(`[WEBHOOK] Received webhook id=${webhookId}`);

    if (!rawBody) {
      this.logger.error('[WEBHOOK] Raw body unavailable — @fastify/rawbody not registered');
      throw new BadRequestException('Raw body unavailable — ensure @fastify/rawbody is registered');
    }
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      this.logger.error(
        `[WEBHOOK] Missing headers. id=${!!webhookId} ts=${!!webhookTimestamp} sig=${!!webhookSignature}`,
      );
      throw new BadRequestException('Missing Svix webhook headers');
    }

    try {
      await this.billingService.handleWebhook(
        rawBody,
        webhookId,
        webhookTimestamp,
        webhookSignature,
      );
      this.logger.log(`[WEBHOOK] ✓ Processed webhook id=${webhookId}`);
      return { received: true };
    } catch (err) {
      this.logger.error(
        `[WEBHOOK] ✗ Failed to process webhook id=${webhookId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
