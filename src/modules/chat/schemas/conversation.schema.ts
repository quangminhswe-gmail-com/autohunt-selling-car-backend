import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  participants!: Types.ObjectId[];

  @Prop()
  lastMessage!: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
