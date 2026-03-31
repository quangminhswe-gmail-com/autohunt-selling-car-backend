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

import { User, UserDocument } from '@/modules/users/user.schema';

import { CreateReviewDto } from '@/modules/marketplaces/dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async updateSellerRating(sellerId: string) {
    const reviews = await this.reviewModel.find({
      ownerId: new Types.ObjectId(sellerId),
    });

    if (reviews.length === 0) {
      // No reviews, set rating to 0
      await this.userModel.updateOne(
        { _id: new Types.ObjectId(sellerId) },
        { rating: 0 },
      );
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10;

    // Update user's rating
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(sellerId) },
      { rating: roundedRating },
    );
  }

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

    const savedReview = await review.save();

    // Update seller's rating
    await this.updateSellerRating(order.ownerId.toString());

    return savedReview;
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

  async getReviewsBySeller(sellerId: string) {
    return await this.reviewModel
      .find({
        ownerId: new Types.ObjectId(sellerId),
      })
      .populate('customerId', 'firstName lastName email avatarUrl')
      .populate('vehicleId', 'make model year images')
      .sort({ createdAt: -1 });
  }

  async getReviewsByVehicle(vehicleId: string) {
    return await this.reviewModel
      .find({
        vehicleId: new Types.ObjectId(vehicleId),
      })
      .populate('customerId', 'firstName lastName email avatarUrl')
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }
}
