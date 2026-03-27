import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type SupportMessageDocument = SupportMessage & Document;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ required: true })
  requestId: Types.ObjectId;

  @Prop({ required: true })
  senderId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['customer', 'admin'],
    required: true,
  })
  senderRole: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: [] })
  attachments: string[];
}

export const SupportMessageSchema =
  SchemaFactory.createForClass(SupportMessage);
