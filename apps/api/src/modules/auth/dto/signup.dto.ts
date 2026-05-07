import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 10, description: 'At least 10 characters, one digit or symbol' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[\d\W])/, { message: 'Password must contain at least one number or symbol' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;
}
