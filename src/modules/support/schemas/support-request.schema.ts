import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@/modules/support/enums';

export type SupportRequestDocument = SupportRequest & Document;

@Schema({ timestamps: true })
export class SupportRequest {
  @Prop({ required: true, unique: true })
  ticketCode: string;

  @Prop({ required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: SupportCategory,
    default: SupportCategory.OTHER,
  })
  category: SupportCategory;

  @Prop({
    type: String,
    enum: SupportPriority,
    default: SupportPriority.MEDIUM,
  })
  priority: SupportPriority;

  @Prop({
    type: String,
    enum: SupportStatus,
    default: SupportStatus.OPEN,
  })
  status: SupportStatus;

  @Prop()
  assignedAdminId?: Types.ObjectId;

  @Prop()
  postingId?: Types.ObjectId;

  @Prop()
  vehicleId?: Types.ObjectId;

  @Prop()
  transactionId?: Types.ObjectId;

  @Prop({ default: [] })
  attachments: string[];
}

export const SupportRequestSchema =
  SchemaFactory.createForClass(SupportRequest);
