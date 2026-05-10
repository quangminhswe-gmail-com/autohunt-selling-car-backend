import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class BuyerProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop()
  preferredBrand?: string;

  @Prop()
  preferredType?: string;

  @Prop()
  preferredColor?: string;

  @Prop()
  minYear?: number;

  @Prop()
  maxPrice?: number;

  @Prop({ type: [String], default: [] })
  preferredFeatures: string[];

  @Prop()
  usagePurpose?: string;
}

// 🔥 THÊM DÒNG NÀY
export type BuyerProfileDocument = BuyerProfile & Document;

export const BuyerProfileSchema = SchemaFactory.createForClass(BuyerProfile);
