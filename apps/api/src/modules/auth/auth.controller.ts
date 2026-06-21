import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MfaVerifyDto, MfaDisableDto } from './dto/mfa.dto';
import { RequestEmailChangeDto, ConfirmEmailChangeDto } from './dto/change-email.dto';
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
      secure: this.isProd || this.config.get<string>('NODE_ENV') === 'staging',
      sameSite: (this.isProd || this.config.get<string>('NODE_ENV') === 'staging') ? 'none' as const : 'lax' as const,
      path: COOKIE_PATH,
      maxAge: 30 * 24 * 60 * 60,
    };
  }

  private clearCookieOpts() {
    return {
      httpOnly: true,
      secure: this.isProd || this.config.get<string>('NODE_ENV') === 'staging',
      sameSite: (this.isProd || this.config.get<string>('NODE_ENV') === 'staging') ? 'none' as const : 'lax' as const,
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

  // ── Get current user profile ─────────────────────────────────────────────────

  @Get('me')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return { data: await this.authService.getProfile(userId) };
  }

  // ── Update profile ────────────────────────────────────────────────────────────

  @Patch('me')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (firstName, lastName)' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return { data: await this.authService.updateProfile(userId, dto) };
  }

  // ── List active sessions ──────────────────────────────────────────────────────

  @Get('sessions')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for current user' })
  async listSessions(@CurrentUser('id') userId: string) {
    return { data: await this.authService.listSessions(userId) };
  }

  // ── Revoke a specific session ─────────────────────────────────────────────────

  @Delete('sessions/:id')
  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    await this.authService.revokeSession(userId, sessionId);
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

  // ── MFA: Enroll ───────────────────────────────────────────────────────────────

  @Post('mfa/enroll')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Begin TOTP MFA enrollment — returns secret and otpauth URL' })
  async enrollMfa(@CurrentUser('id') userId: string) {
    return { data: await this.authService.enrollMfa(userId) };
  }

  // ── MFA: Verify enrollment ────────────────────────────────────────────────────

  @Post('mfa/verify')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify TOTP code to activate MFA — returns one-time backup codes' })
  async verifyMfa(
    @CurrentUser('id') userId: string,
    @Body() dto: MfaVerifyDto,
  ) {
    return { data: await this.authService.verifyMfaEnrollment(userId, dto.code) };
  }

  // ── MFA: Disable ──────────────────────────────────────────────────────────────

  @Post('mfa/disable')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Disable MFA — requires valid TOTP code or backup code' })
  async disableMfa(
    @CurrentUser('id') userId: string,
    @Body() dto: MfaDisableDto,
  ) {
    return { data: await this.authService.disableMfa(userId, dto) };
  }

  // ── MFA: Regenerate backup codes ──────────────────────────────────────────────

  @Post('mfa/backup-codes/regenerate')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Regenerate MFA backup codes — invalidates previous codes' })
  async regenerateBackupCodes(@CurrentUser('id') userId: string) {
    return { data: await this.authService.regenerateBackupCodes(userId) };
  }

  // ── Email change: Request ─────────────────────────────────────────────────────

  @Post('change-email/request')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Request email address change — sends verification token to new email' })
  async requestEmailChange(
    @CurrentUser('id') userId: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return await this.authService.requestEmailChange(userId, orgId, dto.newEmail);
  }

  // ── Email change: Confirm ─────────────────────────────────────────────────────

  @Post('change-email/confirm')
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm email change with the token sent to new address' })
  async confirmEmailChange(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmEmailChangeDto,
  ) {
    return await this.authService.confirmEmailChange(userId, dto.token);
  }

}
