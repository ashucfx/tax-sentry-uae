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
        let expiresIn: string | number = configService.get<string>('JWT_EXPIRY') || '15m';
        if (typeof expiresIn === 'string' && /^\d+$/.test(expiresIn.trim())) {
          expiresIn = parseInt(expiresIn.trim(), 10);
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
