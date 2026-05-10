import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BuyerSearchDocument = HydratedDocument<BuyerSearch>;

@Schema({ timestamps: true })
export class BuyerSearch {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  query: string;

  @Prop({ trim: true })
  make?: string;

  @Prop({ trim: true })
  model?: string;

  @Prop()
  yearOfManufacture?: number;

  @Prop({ type: Types.ObjectId, ref: 'Posting', default: null })
  matchedPostingId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  matchedAt?: Date | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  notifyEmail?: string | null;

  @Prop({ default: false })
  emailOptIn: boolean;

  @Prop({ type: Date, default: null })
  emailSentAt?: Date | null;

  @Prop({ default: true })
  active: boolean;
}

export const BuyerSearchSchema = SchemaFactory.createForClass(BuyerSearch);
