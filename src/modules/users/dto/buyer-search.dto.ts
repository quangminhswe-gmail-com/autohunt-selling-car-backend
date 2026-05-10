import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBuyerSearchDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  yearOfManufacture?: number;

  @IsOptional()
  @IsEmail()
  notifyEmail?: string;

  @IsOptional()
  @IsBoolean()
  emailOptIn?: boolean;
}

export class UpdateBuyerSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  yearOfManufacture?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsMongoId()
  matchedPostingId?: string;

  @IsOptional()
  @IsEmail()
  notifyEmail?: string;

  @IsOptional()
  @IsBoolean()
  emailOptIn?: boolean;
}

export class BuyerSearchResponseDto {
  _id: string;
  buyerId: string;
  query: string;
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  matchedPostingId?: any;
  matchedAt?: Date | null;
  notifyEmail?: string | null;
  emailOptIn?: boolean;
  emailSentAt?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
