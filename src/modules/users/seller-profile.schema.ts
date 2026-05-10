import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class SellerProfile extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true, // 1 user = 1 seller profile
  })
  userId: Types.ObjectId;

  // 🎯 Mục tiêu bán
  @Prop({
    enum: ['FAST_SALE', 'BEST_PRICE', 'NORMAL'],
    default: 'NORMAL',
  })
  sellingPriority: string;

  // 💰 Có linh hoạt giá không
  @Prop({ default: true })
  isNegotiable: boolean;

  // 📍 Khu vực bán (ưu tiên buyer gần)
  @Prop()
  preferredLocation?: string;

  // 👥 Loại buyer mong muốn
  @Prop({
    enum: ['INDIVIDUAL', 'BUSINESS', 'ANY'],
    default: 'ANY',
  })
  preferredBuyerType: string;

  // ⚡ Mức độ hoạt động
  @Prop({ default: true })
  isActive: boolean;

  // 📞 Thời gian phản hồi (giả lập AI thông minh hơn)
  @Prop({ default: 24 })
  responseTimeHours: number;

  // 🌟 Highlight (optional – để AI dùng)
  @Prop({ type: [String], default: [] })
  highlights: string[];
  // ví dụ: ["bán gấp", "xe đẹp", "giá tốt"]
}

export type SellerProfileDocument = SellerProfile & Document;
export const SellerProfileSchema = SchemaFactory.createForClass(SellerProfile);
