import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVE_KEYS_PER_ORG = 10;

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new API key for the org.
   *
   * Format: `tsk_` + 64 hex chars (randomBytes(32).toString('hex'))
   * Prefix stored for display: `tsk_` + first 8 hex chars  → e.g. `tsk_a1b2c3d4`
   * Only the SHA-256 hash is persisted — the plain key is returned once.
   *
   * Enforces a maximum of 10 active keys per org.
   */
  async createApiKey(
    orgId: string,
    userId: string,
    name: string,
    expiresAt?: string,
  ) {
    const activeCount = await this.prisma.apiKey.count({
      where: { orgId, isActive: true },
    });

    if (activeCount >= MAX_ACTIVE_KEYS_PER_ORG) {
      throw new BadRequestException(
        `Maximum of ${MAX_ACTIVE_KEYS_PER_ORG} active API keys allowed per organisation. Revoke an existing key first.`,
      );
    }

    const hex = randomBytes(32).toString('hex'); // 64 hex chars
    const plainKey = `tsk_${hex}`;
    const prefix = `tsk_${hex.slice(0, 8)}`;
    const keyHash = createHash('sha256').update(plainKey).digest('hex');

    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      throw new BadRequestException('Invalid expiresAt date format');
    }

    const record = await this.prisma.apiKey.create({
      data: {
        orgId,
        name,
        keyHash,
        prefix,
        expiresAt: expiresAtDate ?? null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'API_KEY_CREATED',
        entity: 'ApiKey',
        entityId: record.id,
        afterJson: { name, prefix },
      },
    }).catch(() => {});

    return {
      key: plainKey,
      id: record.id,
      prefix,
      name: record.name,
      createdAt: record.createdAt,
    };
  }

  /**
   * Lists all active keys for the org.
   * keyHash is never included in the response.
   */
  async listApiKeys(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Soft-deletes an API key by setting isActive = false.
   * Writes an audit log entry of action API_KEY_REVOKED.
   */
  async deleteApiKey(orgId: string, userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, orgId, isActive: true },
      select: { id: true, name: true, prefix: true },
    });

    if (!key) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'API_KEY_REVOKED',
        entity: 'ApiKey',
        entityId: keyId,
        afterJson: { name: key.name, prefix: key.prefix },
      },
    }).catch(() => {});
  }
}
