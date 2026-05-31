import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const rawExpiry = configService.get('JWT_EXPIRY');
        let expiresIn: string = rawExpiry ? String(rawExpiry) : '15m';
        if (/^\d+$/.test(expiresIn.trim())) {
          // If user provided a raw number like "15", jsonwebtoken treats it as seconds.
          // Append 'm' to treat it as minutes to prevent instant 401 expiration.
          expiresIn = `${expiresIn.trim()}m`;
        }
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
            issuer: 'taxsentry-api',
            audience: 'taxsentry-client',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy],
  exports: [AuthService, OtpService, JwtModule],
})
export class AuthModule {}
