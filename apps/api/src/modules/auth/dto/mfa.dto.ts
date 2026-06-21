import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class MfaDisableDto {
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  backupCode?: string;
}
