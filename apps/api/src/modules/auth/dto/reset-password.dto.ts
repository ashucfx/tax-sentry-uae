import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: 10, description: 'At least 10 characters, one digit or symbol' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[\d\W])/, { message: 'Password must contain at least one number or symbol' })
  password: string;
}
