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
    const minPrice = hasBudget ? Math.round(budget * 0.7) : undefined;

    const maxPrice = hasBudget
      ? Math.min(Math.round(budget * 1.1), budget + 500_000_000)
      : undefined;

    const postingFilter: any = { status: 'active' };

    if (hasBudget) {
      postingFilter.price = { $gte: minPrice, $lte: maxPrice };
    }

    // =========================
    // 🎯 CAR TYPE (FIX CỨNG)
    // =========================
    let vehicleMatch: any = {};

    if (intent?.mappedType && Array.isArray(intent.mappedType)) {
      vehicleMatch.type = { $in: intent.mappedType };
    } else if (intent?.carType) {
      vehicleMatch.type = {
        $regex: String(intent.carType).trim(),
        $options: 'i',
      };
    }

    // =========================
    // 🎯 PASSENGERS (MỚI)
    // =========================
    if (intent?.passengers) {
      vehicleMatch.seats = { $gte: intent.passengers };
    }

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
          price: {
            $gte: Math.round(budget * 0.6),
            $lte: budget + 500_000_000, // 🔥 khóa trần
          },
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

    // =========================
    // 🎯 SMART RANKING (UPGRADE)
    // =========================
    if (hasBudget) {
      postings = postings
        .map((p: any) => ({
          ...p,
          score: this.calculateScore(p, intent),
        }))
        .sort((a: any, b: any) => b.score - a.score);
    }

    // 🔥 đảm bảo không vượt quá +500tr
if (hasBudget) {
  postings = postings.filter(
    (p: any) => Number(p.price || 0) <= budget + 500_000_000,
  );
}

return postings.slice(0, 8);
  }

  // =========================
  // 🎯 SCORING (MỚI)
  // =========================
  private calculateScore(posting: any, intent: any): number {
    let score = 0;

    const price = Number(posting.price || 0);
    const budget = Number(intent?.budget || 0);

    // 🎯 PRICE MATCH
    if (budget && price) {
      const diff = Math.abs(price - budget);
      score += 100 - diff / 1_000_000;
    }

    const vehicle = posting.vehicleId || {};

    // 🎯 TYPE MATCH
    if (intent?.carType && vehicle?.type) {
      if (
        vehicle.type.toLowerCase().includes(intent.carType.toLowerCase())
      ) {
        score += 50;
      }
    }

    // 🎯 SEATS MATCH
    if (intent?.passengers && vehicle?.seats) {
      if (vehicle.seats >= intent.passengers) {
        score += 30;
      }
    }

    return score;
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