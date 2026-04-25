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
    const budget = Number(intent?.budget || 0);
    const hasBudget = Number.isFinite(budget) && budget > 0;

    // Default: ±20% quanh ngân sách (có thể tinh chỉnh sau)
    const minPrice = hasBudget ? Math.round(budget * 0.8) : undefined;
    const maxPrice = hasBudget ? Math.round(budget * 1.2) : undefined;

    const postingFilter: any = { status: 'active' };
    if (hasBudget) {
      postingFilter.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Lọc loại xe dựa trên Vehicle.type (populate + match).
    const vehicleMatch = intent?.carType
      ? { type: { $regex: String(intent.carType).trim(), $options: 'i' } }
      : undefined;

    let postings = await this.postingModel
      .find(postingFilter)
      .populate({
        path: 'vehicleId',
        match: vehicleMatch,
      })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    // Do populate match: posting nào không khớp sẽ có vehicleId=null → loại bỏ
    postings = postings.filter((p: any) => Boolean(p.vehicleId));

    // Nếu quá hẹp không ra kết quả, nới dần (±35%) để vẫn có option “gần phù hợp”
    if (!postings.length && hasBudget) {
      const relaxed = await this.postingModel
        .find({
          status: 'active',
          price: { $gte: Math.round(budget * 0.65), $lte: Math.round(budget * 1.35) },
        })
        .populate({
          path: 'vehicleId',
          match: vehicleMatch,
        })
        .sort({ createdAt: -1 })
        .limit(60)
        .lean();

      postings = relaxed.filter((p: any) => Boolean(p.vehicleId));
    }

    // Ranking: ưu tiên gần ngân sách nhất
    if (hasBudget) {
      postings.sort(
        (a: any, b: any) => Math.abs(Number(a.price || 0) - budget) - Math.abs(Number(b.price || 0) - budget),
      );
    }

    return postings.slice(0, 8);
  }

  private buildSearchRegex(keyword: string) {
    const words = keyword.split(' ').filter(Boolean);
    return new RegExp(words.join('|'), 'i');
  }

  async searchByKeyword(keyword: string) {
    const regex = this.buildSearchRegex(keyword);

    return this.postingModel
      .find({
        status: 'active',
        $or: [{ title: regex }, { description: regex }],
      })
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();
  }
}
