import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TransmissionType,
  VehicleType,
  FuelType,
  VehicleCondition,
} from '@/common/constants/enum';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @Type(() => Number)
  @IsNumber()
  yearOfManufacture: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsString()
  vinNumber: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mileage?: number;

  @IsEnum(TransmissionType)
  transmission: string;

  @IsEnum(VehicleType)
  type: string;

  @IsEnum(FuelType)
  fuelType: string;

  @IsEnum(VehicleCondition)
  condition: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((item) => item.trim())
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  images?: string[];
}
