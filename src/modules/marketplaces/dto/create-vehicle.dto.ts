import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @IsEnum(['automatic', 'manual', 'cvt'])
  transmission: string;

  @IsEnum(['sedan', 'suv', 'pickup', 'hatchback', 'mpv'])
  type: string;

  @IsEnum(['petrol', 'diesel', 'electric', 'hybrid'])
  fuelType: string;

  @IsEnum(['new', 'used'])
  condition: string;

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
