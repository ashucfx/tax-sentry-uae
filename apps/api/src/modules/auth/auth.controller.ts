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
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

  // ── Sign up ──────────────────────────────────────────────────────────────────

  @Post('signup')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 20, ttl: 3600000 } })
  @ApiOperation({ summary: 'Create new user account and organization' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  @Post('login')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 }, medium: { limit: 30, ttl: 900000 } })
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const meta = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.login(dto.email, dto.password, meta);
    res.setCookie(REFRESH_COOKIE, result.refreshToken, this.cookieOpts());
    return { accessToken: result.accessToken, user: result.user };
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

  // ── Forgot password ──────────────────────────────────────────────────────────

  @Post('forgot-password')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 3, ttl: 300000 }, medium: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
  }

  // ── Reset password ───────────────────────────────────────────────────────────

  @Post('reset-password')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
  }

  // ── Verify email ─────────────────────────────────────────────────────────────

  @Post('verify-email')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 10, ttl: 300000 } })
  @ApiOperation({ summary: 'Verify email address using token from signup email' })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
  }

  // ── Resend verification email ─────────────────────────────────────────────────

  @Post('resend-verification')
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 2, ttl: 300000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@CurrentUser('id') userId: string) {
    await this.authService.resendVerificationEmail(userId);
  }

  // ── Accept invitation ─────────────────────────────────────────────────────────

  @Post('accept-invite')
  @Public()
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Accept an org invitation and create account' })
  async acceptInvite(
    @Body() dto: { token: string; password: string; firstName?: string; lastName?: string },
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
