import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationTarget {
  ALL = 'all',
  CUSTOMER = 'customer',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    enum: NotificationTarget,
    required: true,
  })
  targetRole: NotificationTarget;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  targetUserId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false })
  isSent: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
