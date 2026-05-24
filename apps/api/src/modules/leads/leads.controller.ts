import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadsService: LeadsService) {}

  /**
   * POST /api/v1/leads/demo-request
   *
   * Public endpoint — no auth required.
   * Rate-limited: 3 requests per 10 minutes per IP.
   */
  @Post('demo-request')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 3, ttl: 600000 } })
  @ApiOperation({ summary: 'Submit a demo request (public lead capture)' })
  async submitDemoRequest(
    @Body() dto: CreateLeadDto,
    @Req() req: FastifyRequest,
  ) {
    // Honeypot: bot-submitted if `website` field is non-empty
    if ((dto as any).website) {
      this.logger.warn(`[HONEYPOT] Bot submission blocked from IP ${req.ip}`);
      // Return 201 so bots don't know they were caught
      return { id: 'ok' };
    }

    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.leadsService.submitDemoRequest(dto, meta);
    return result;
  }
}
