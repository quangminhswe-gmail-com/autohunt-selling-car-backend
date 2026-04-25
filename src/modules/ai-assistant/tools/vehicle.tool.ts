// tools/vehicle.tool.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from '@/modules/marketplaces/schemas/vehicle.schema';
import { Posting } from '@/modules/marketplaces/schemas/posting.schema';
@Injectable()
export class VehicleTool {
  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<Vehicle>,

    @InjectModel(Posting.name)
    private postingModel: Model<Posting>,
  ) {}

  async search(intent: any) {
    const vehicleFilter: any = {};

    if (intent.budget) {
      vehicleFilter.price = { $lte: intent.budget * 1.05 };
    }

    if (intent.carType) {
      vehicleFilter.type = { $regex: intent.carType, $options: 'i' };
    }

    const vehicles = await this.vehicleModel.find(vehicleFilter).limit(30).lean();
    if (!vehicles.length) return [];

    const vehicleIds = vehicles.map((v: any) => v._id);
    const postings = await this.postingModel
      .find({
        status: 'active',
        vehicleId: { $in: vehicleIds },
      })
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return postings;
  }

  private buildSearchRegex(keyword: string) {
    const words = keyword.split(' ').filter(Boolean);
    return new RegExp(words.join('|'), 'i');
  }

  async searchByKeyword(keyword: string) {
    const regex = this.buildSearchRegex(keyword);

    return this.postingModel.find({
      status: 'active',
      $or: [{ title: regex }, { description: regex }],
    });
  }
}
