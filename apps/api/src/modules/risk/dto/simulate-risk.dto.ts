import { IsOptional, IsNumber, IsArray, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SimulateRiskDto {
  @ApiPropertyOptional({ description: 'Additional qualifying revenue to add (AED)', example: 500000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  additionalRevenue?: number;

  @ApiPropertyOptional({ description: 'Additional NQI revenue to add (AED)', example: 100000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  additionalNqiRevenue?: number;

  @ApiPropertyOptional({ description: 'Transaction IDs to hypothetically reclassify as QI', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reclassifyTransactionIds?: string[];
}
