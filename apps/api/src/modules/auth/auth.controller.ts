import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Webhook } from 'svix';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Issue a token after Clerk verifies the user
   * Frontend sends clerkUserId after successful Clerk auth
   */
  @Post('token')
  @ApiOperation({ summary: 'Exchange Clerk session for API JWT' })
  async getToken(@Body('clerkUserId') clerkUserId: string) {
    if (!clerkUserId) throw new BadRequestException('clerkUserId required');
    return this.authService.issueToken(clerkUserId);
  }

  /**
   * Clerk webhook endpoint — handles user.created, user.deleted, etc.
   * Secured by svix webhook signature verification
   */
  @Post('clerk-webhook')
  @ApiOperation({ summary: 'Clerk webhook receiver (internal)' })
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) throw new BadRequestException('Webhook secret not configured');

    const rawBody = (req as any).rawBody as Buffer;
    if (!rawBody) throw new BadRequestException('Raw body required');

    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: Record<string, unknown> };

    try {
      event = wh.verify(rawBody.toString(), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as typeof event;
    } catch {
      this.logger.warn('Invalid Clerk webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Clerk webhook: ${event.type}`);

    if (event.type === 'user.created') {
      const data = event.data as {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        public_metadata?: { orgId?: string; role?: string };
      };

      const email = data.email_addresses[0]?.email_address;
      const orgId = data.public_metadata?.orgId;

      if (email && orgId) {
        await this.authService.handleClerkUserCreated({
          clerkUserId: data.id,
          email,
          firstName: data.first_name,
          lastName: data.last_name,
          orgId,
          role: data.public_metadata?.role as any,
        });
      }
    }

    return { received: true };
  }
}
