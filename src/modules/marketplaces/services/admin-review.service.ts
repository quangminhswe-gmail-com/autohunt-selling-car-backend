import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Review,
  ReviewDocument,
} from '@/modules/marketplaces/schemas/review.schema';

@Injectable()
export class AdminReviewsService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
  ) {}

  async getAllReviews() {
    return await this.reviewModel
      .find()
      .populate('customerId', 'fullName email')
      .populate('ownerId', 'fullName email')
      .populate('vehicleId', 'make model')
      .sort({ createdAt: -1 });
  }

  async deleteReview(reviewId: string) {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new NotFoundException('Invalid review id');
    }

    const deleted = await this.reviewModel.findByIdAndDelete(reviewId);

    if (!deleted) {
      throw new NotFoundException('Review not found');
    }

    return {
      message: 'Review deleted successfully',
    };
  }
}
