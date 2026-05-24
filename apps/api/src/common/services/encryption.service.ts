import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('JWT_SECRET'); // Using JWT_SECRET as base for ease, ideally separate ENCRYPTION_KEY
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters for AES-256 encryption');
    }
    this.key = Buffer.from(secret.slice(0, 32), 'utf-8');
  }

  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) throw new Error('Invalid encrypted data format');
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${(error as Error).message}`);
      throw new Error('Failed to decrypt data');
    }
  }
}
