import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '@/modules/users/user.schema';
import {
  VehicleMake,
  VehicleType,
  TransmissionType,
  FuelType,
  VehicleCondition,
} from '@/common/constants/enum';

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({
    type: String,
    enum: VehicleMake,
    required: true,
  })
  make: VehicleMake;

  @Prop({ required: true, trim: true, uppercase: true })
  model: string;

  @Prop({
    required: true,
    min: 1900,
  })
  yearOfManufacture: number;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
    required: true,
  })
  licensePlate: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
  })
  vinNumber?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({
    min: 0,
    default: 0,
  })
  mileage: number;

  @Prop({
    type: String,
    enum: TransmissionType,
    required: true,
  })
  transmission: TransmissionType;

  @Prop({
    type: String,
    enum: VehicleType,
    required: true,
  })
  type: VehicleType;

  @Prop({
    type: String,
    enum: FuelType,
    required: true,
  })
  fuelType: FuelType;

  @Prop({
    type: String,
    enum: VehicleCondition,
    required: true,
  })
  condition: VehicleCondition;

  @Prop({
    type: [String],
    default: [],
  })
  features: string[];

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  ownerId: Types.ObjectId;
}

export type VehicleDocument = Vehicle & Document;
export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
