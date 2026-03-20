import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { Vehicle } from '@modules/marketplaces/schemas/vehicle.schema';
import { User } from '@modules/users/user.schema';
import { PostingStatus } from '@/common/constants/enum';

@Schema({ timestamps: true })
export class Posting {
  @Prop({
    type: Types.ObjectId,
    ref: Vehicle.name,
    required: true,
  })
  vehicleId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  sellerId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    required: false,
  })
  description: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    default: 'VND',
    uppercase: true,
  })
  currency: string;

  @Prop({ trim: true })
  locationCity: string;

  @Prop({ trim: true })
  locationDistrict: string;

  @Prop({ trim: true })
  locationAddress: string;

  @Prop({
    type: String,
    enum: PostingStatus,
    default: PostingStatus.DRAFT,
  })
  status: PostingStatus;

  @Prop({
    default: 0,
    min: 0,
  })
  viewCount: number;

  @Prop()
  expiredAt?: Date;
}

export type PostingDocument = Posting & Document;
export const PostingSchema = SchemaFactory.createForClass(Posting);
