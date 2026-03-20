import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  ESCROW = 'escrow',
}

export enum DeliveryStatus {
  NOT_DELIVERED = 'not_delivered',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Posting', required: true })
  postingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  agreedPrice: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({
    type: Object,
  })
  vehicleSnapshot: {
    make: string;
    model: string;
    yearOfManufacture: number;
    color: string;
    mileage: number;
  };

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: 0 })
  depositAmount: number;

  @Prop()
  paidAt: Date;

  @Prop({
    type: String,
    enum: DeliveryStatus,
    default: DeliveryStatus.NOT_DELIVERED,
  })
  deliveryStatus: DeliveryStatus;

  @Prop()
  completedAt: Date;

  @Prop()
  cancelledAt: Date;

  @Prop()
  cancelReason: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ customerId: 1 });
OrderSchema.index({ ownerId: 1 });
OrderSchema.index({ postingId: 1 });
