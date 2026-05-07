import {
  IsEmail,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ required: false, example: 'user@company.com' })
  @ValidateIf((o: VerifyOtpDto) => !o.phone)
  @IsEmail({}, { message: 'Provide a valid email address' })
  email?: string;

  @ApiProperty({ required: false, example: '+971501234567' })
  @ValidateIf((o: VerifyOtpDto) => !o.email)
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Phone must be in E.164 format, e.g. +971501234567' })
  phone?: string;

  @ApiProperty({ example: '482910' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 numeric digits' })
  otp: string;
}
