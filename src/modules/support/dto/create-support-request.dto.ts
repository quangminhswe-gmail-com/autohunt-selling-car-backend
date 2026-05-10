import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

import { SupportCategory } from '@/modules/support/enums';

export class CreateSupportRequestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(SupportCategory)
  category?: SupportCategory;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsString()
  postingId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
