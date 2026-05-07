import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ required: false, example: 'user@company.com' })
  @ValidateIf((o: SendOtpDto) => !o.phone)
  @IsEmail({}, { message: 'Provide a valid email address' })
  email?: string;

  @ApiProperty({ required: false, example: '+971501234567' })
  @ValidateIf((o: SendOtpDto) => !o.email)
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Phone must be in E.164 format, e.g. +971501234567' })
  phone?: string;

  // Class-level guard enforced in the service — both fields are @IsOptional so that
  // class-validator doesn't require them individually, but ValidateIf ensures the
  // provided field is validated. The service throws if neither is present.
}
