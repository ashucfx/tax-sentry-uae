import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Called from Clerk webhook on user.created
   * Creates the user record in our DB after Clerk confirms identity
   */
  async handleClerkUserCreated(payload: {
    clerkUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    orgId: string;
    role?: UserRole;
  }) {
    const user = await this.prisma.user.upsert({
      where: { clerkUserId: payload.clerkUserId },
      update: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      create: {
        clerkUserId: payload.clerkUserId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        orgId: payload.orgId,
        role: payload.role ?? UserRole.OWNER,
      },
    });

    this.logger.log(`User synced from Clerk: ${user.email}`);
    return user;
  }

  /**
   * Issue a short-lived JWT for the session
   * Called after Clerk verifies the user on the frontend
   */
  async issueToken(clerkUserId: string): Promise<{ token: string; user: object }> {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
      include: { organization: { select: { id: true, name: true, subscriptionTier: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const payload = {
      sub: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
      clerkUserId: user.clerkUserId,
    };

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        org: user.organization,
      },
    };
  }
}
