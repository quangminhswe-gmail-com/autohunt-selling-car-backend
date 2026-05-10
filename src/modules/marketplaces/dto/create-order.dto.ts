import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@/modules/marketplaces/schemas/order.schema';

export class CreateOrderDto {
  @IsMongoId()
  postingId: string;

  @IsMongoId()
  vehicleId: string;

  @IsNumber()
  @Min(0)
  agreedPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}
