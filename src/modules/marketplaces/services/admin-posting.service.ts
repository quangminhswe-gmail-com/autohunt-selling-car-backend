import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostingStatus } from '@/common/constants/enum';
import {
  Posting,
  PostingDocument,
} from '@/modules/marketplaces/schemas/posting.schema';

@Injectable()
export class AdminPostingService {
  constructor(
    @InjectModel(Posting.name)
    private readonly postingModel: Model<PostingDocument>,
  ) {}

  async getAllPostings() {
    return await this.postingModel
      .find()
      .populate('vehicleId')
      .populate('ownerId')
      .sort({ createdAt: -1 });
  }

  async deletePosting(id: string) {
    const posting = await this.postingModel.findById(id);

    if (!posting) {
      throw new NotFoundException('Posting not found');
    }

    await this.postingModel.findByIdAndDelete(id);

    return {
      message: 'Posting deleted successfully',
    };
  }

  async updatePostingStatus(id: string, status: PostingStatus) {
    const posting = await this.postingModel.findById(id);

    if (!posting) {
      throw new NotFoundException('Posting not found');
    }

    posting.status = status;

    return await posting.save();
  }
}
