import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BuyerProfile,
  BuyerProfileDocument,
} from '@/modules/users/buyer-profile.schema';

@Injectable()
export class BuyerTool {
  constructor(
    @InjectModel(BuyerProfile.name)
    private buyerModel: Model<BuyerProfileDocument>,
  ) {}

  async getBuyerProfile(userId: string) {
    return this.buyerModel.findOne({ userId });
  }

  async buildBuyerContext(userId: string) {
    const buyer = await this.getBuyerProfile(userId);

    if (!buyer) {
      return {
        maxPrice: null,
        preferredType: null,
        usagePurpose: null,
      };
    }

    return {
      maxPrice: buyer.maxPrice,
      preferredBrand: buyer.preferredBrand,
      preferredType: buyer.preferredType,
      preferredColor: buyer.preferredColor,
      preferredFeatures: buyer.preferredFeatures,
      usagePurpose: buyer.usagePurpose,
    };
  }
}
