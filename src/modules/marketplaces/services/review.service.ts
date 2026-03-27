import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderStatus,
  DeliveryStatus,
} from '@/modules/marketplaces/schemas/order.schema';

import {
  Review,
  ReviewDocument,
} from '@/modules/marketplaces/schemas/review.schema';

import { CreateReviewDto } from '@/modules/marketplaces/dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async createReview(dto: CreateReviewDto, customerId: string) {
    const order = await this.orderModel.findById(dto.orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId.toString() !== customerId) {
      throw new ForbiddenException('Not your order');
    }

    if (order.orderStatus !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Order not completed');
    }

    if (order.deliveryStatus !== DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Vehicle not delivered');
    }

    const existingReview = await this.reviewModel.findOne({
      orderId: dto.orderId,
    });

    if (existingReview) {
      throw new BadRequestException('Already reviewed');
    }

    const review = new this.reviewModel({
      orderId: dto.orderId,
      vehicleId: order.vehicleId,
      customerId,
      ownerId: order.ownerId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return await review.save();
  }

  async getMyReviews(customerId: string) {
    return await this.reviewModel
      .find({
        customerId: new Types.ObjectId(customerId),
      })
      .populate('vehicleId', 'make model images')
      .populate('ownerId', 'fullName email')
      .sort({ createdAt: -1 });
  }
}
