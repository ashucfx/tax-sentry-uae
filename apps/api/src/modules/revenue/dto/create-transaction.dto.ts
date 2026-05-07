import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CounterpartyType, TransactionSource } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 150000.00, description: 'Amount in AED (positive, or negative for credit notes)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  amountAed: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 3.6725, description: 'FX rate to AED (required if currency != AED)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Type(() => Number)
  fxRateToAed?: number;

  @ApiProperty({ example: 'Acme Trading LLC', description: 'Use UNKNOWN if counterparty is not known' })
  @IsString()
  @MaxLength(500)
  counterparty: string;

  @ApiProperty({ enum: CounterpartyType, example: CounterpartyType.THIRD_PARTY })
  @IsEnum(CounterpartyType)
  counterpartyType: CounterpartyType;

  @ApiPropertyOptional({ example: 'TRADING_COMMODITIES', description: 'Activity code from activity_catalog' })
  @IsOptional()
  @IsString()
  activityCode?: string;

  @ApiPropertyOptional({ enum: TransactionSource, default: TransactionSource.MANUAL })
  @IsOptional()
  @IsEnum(TransactionSource)
  source?: TransactionSource = TransactionSource.MANUAL;

  @ApiPropertyOptional({ description: 'Upstream system ID for idempotency (set by integrations; auto-generated for MANUAL)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalId?: string;

  @ApiPropertyOptional({ example: 'INV-2024-0042' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNo?: string;

  @ApiPropertyOptional({ example: 'Trading of qualifying commodities — crude oil' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCreditNote?: boolean = false;

  @ApiPropertyOptional({ description: 'Link to original transaction for credit notes' })
  @IsOptional()
  @IsString()
  linkedTransactionId?: string;

  @ApiPropertyOptional({ default: false, description: 'True for deferred revenue (recognized when earned)' })
  @IsOptional()
  @IsBoolean()
  isDeferred?: boolean = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRelatedParty?: boolean = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDesignatedZone?: boolean = false;
}

export class OverrideClassificationDto {
  @ApiProperty({ enum: ['QI', 'NQI', 'EXCLUDED'], example: 'QI' })
  @IsEnum(['QI', 'NQI', 'EXCLUDED'])
  newClassification: 'QI' | 'NQI' | 'EXCLUDED';

  @ApiProperty({ example: 'TP_CONFIRMED', description: 'Reason code for audit trail' })
  @IsString()
  @MinLength(2)
  reasonCode: string;

  @ApiProperty({ example: 'Transfer pricing documentation confirms arm\'s length pricing.' })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  reasonText: string;
}

export class CsvUploadDto {
  @ApiProperty({ description: 'Tax period ID to associate transactions with' })
  @IsString()
  taxPeriodId: string;
}
