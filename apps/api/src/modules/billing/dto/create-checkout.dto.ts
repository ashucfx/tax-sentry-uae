import { IsEnum, IsIn } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateCheckoutDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsIn(['monthly', 'yearly'])
  interval: 'monthly' | 'yearly';
}
