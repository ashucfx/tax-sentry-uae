import { IsEmail, IsString, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateLeadDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @ApiPropertyOptional({ example: 'Al Maktoum' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ example: 'cfo@company.ae' })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @ApiPropertyOptional({ example: '+971 50 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[+\d\s\-().]{7,30}$/, { message: 'Invalid phone format' })
  phone?: string;

  @ApiPropertyOptional({ example: 'CFO' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiProperty({ example: 'Acme FZE' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  company: string;

  @ApiPropertyOptional({ example: 'DMCC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  freeZone?: string;

  @ApiPropertyOptional({ example: '11–50 employees' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  companySize?: string;

  @ApiPropertyOptional({ example: 'AED 5M – 20M' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  revenueRange?: string;

  @ApiPropertyOptional({ example: 'This week' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  demoSlot?: string;

  @ApiPropertyOptional({ example: 'We have 3 entities across DMCC and JAFZA.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  // Honeypot — must remain empty; bots fill it
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(0, { message: 'Bot detected' })
  website?: string;
}
