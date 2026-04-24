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
    const filter: any = {};

    if (intent.budget) {
      filter.price = { $lte: intent.budget };
    }

    if (intent.carType) {
      filter.type = intent.carType;
    }

    return this.vehicleModel.find(filter).limit(5);
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
