import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_PATH = '/';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly config: ConfigService,
  ) {}

  private get isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private cookieOpts() {
    return {
      httpOnly: true,
      // Secure flag always true in production and staging. Disabled only in local dev
      // (HTTP localhost) to allow browser to send the cookie without HTTPS.
      secure: this.isProd || this.config.get<string>('NODE_ENV') === 'staging',
      sameSite: 'lax' as const,
      path: COOKIE_PATH,
      maxAge: 30 * 24 * 60 * 60,
    };
  }

  private clearCookieOpts() {
    return {
      httpOnly: true,
      secure: this.isProd || this.config.get<string>('NODE_ENV') === 'staging',
      sameSite: 'lax' as const,
      path: COOKIE_PATH,
    };
  }



  // ── Refresh ──────────────────────────────────────────────────────────────────

  @Post('refresh')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const rawToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.authService.refresh(rawToken, meta);

    res.setCookie(REFRESH_COOKIE, result.refreshToken, this.cookieOpts());
    return { accessToken: result.accessToken, user: result.user };
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  @Post('logout')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke current session' })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const rawToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ?? '';
    await this.authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE, this.clearCookieOpts());
  }

  // ── Logout all devices ───────────────────────────────────────────────────────

  @Post('logout-all')
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for this user' })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.logoutAll(userId);
    res.clearCookie(REFRESH_COOKIE, this.clearCookieOpts());
  }



  // ── Accept invitation ─────────────────────────────────────────────────────────

  @Post('accept-invite')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Accept an org invitation and create account' })
  async acceptInvite(
    @Body() dto: { token: string; firstName?: string; lastName?: string },
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.authService.acceptInvite(dto, meta);
    res.setCookie(REFRESH_COOKIE, result.refreshToken, this.cookieOpts());
    return { accessToken: result.accessToken, user: result.user };
  }

  // ── Send OTP ─────────────────────────────────────────────────────────────────

  @Post('send-otp')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Send 6-digit OTP to email or phone (passwordless sign-in)' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────────

  @Post('verify-otp')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP — signs in user, creates account if first time' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.otpService.verifyOtp(dto, meta);
    res.setCookie(REFRESH_COOKIE, result.refreshToken, this.cookieOpts());
    return { accessToken: result.accessToken, user: result.user, isNewUser: result.isNewUser };
  }

  // ── Me ───────────────────────────────────────────────────────────────────────

  @Get('me')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
