import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  BuyerProfile,
  BuyerProfileDocument,
} from '@/modules/users/buyer-profile.schema';
import {
  SellerProfile,
  SellerProfileDocument,
} from '@/modules/users/seller-profile.schema';
import { Posting, PostingDocument } from '../schemas/posting.schema';

@Injectable()
export class AiMatchService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(BuyerProfile.name)
    private buyerModel: Model<BuyerProfileDocument>,

    @InjectModel(SellerProfile.name)
    private sellerModel: Model<SellerProfileDocument>,

    @InjectModel(Posting.name)
    private postingModel: Model<PostingDocument>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // ================================
  // 🔥 MAIN FUNCTION
  // ================================
  async matchBuyer(userId: string) {
    // 1. lấy buyer profile
    const buyer = await this.buyerModel.findOne({ userId }).lean();

    if (!buyer) {
      throw new InternalServerErrorException('Buyer profile not found');
    }

    // 2. lấy postings + vehicle
    const postings = await this.postingModel
      .find({ status: 'ACTIVE' })
      .populate('vehicleId')
      .limit(30)
      .lean();

    // 3. flatten data
    const vehicles = postings.map((p: any) => ({
      _id: p.vehicleId._id,
      make: p.vehicleId.make,
      model: p.vehicleId.model,
      type: p.vehicleId.type,
      fuelType: p.vehicleId.fuelType,
      year: p.vehicleId.yearOfManufacture,
      features: p.vehicleId.features,
      price: p.price,
      location: p.locationCity,
      ownerId: p.ownerId,
    }));

    // 4. AI matching
    let aiResult;
    try {
      aiResult = await this.aiRecommend(buyer, vehicles);
    } catch (err) {
      console.error('AI failed → fallback scoring');
    }

    // 5. fallback nếu AI fail
    if (!aiResult?.matches) {
      const fallback = this.basicMatch(buyer, vehicles);

      return {
        steps: this.getThinkingSteps(),
        isFallback: true,
        results: fallback,
      };
    }

    // 6. map lại data + reason
    const results = aiResult.matches.map((m) => {
      const vehicle = vehicles.find((v) => v._id.toString() === m.vehicleId);

      return {
        ...vehicle,
        score: m.score,
        reason: m.reason,
      };
    });

    return {
      steps: this.getThinkingSteps(),
      isFallback: false,
      results,
    };
  }

  // ================================
  // 🤖 AI RECOMMEND
  // ================================
  async aiRecommend(buyer: any, vehicles: any[]) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const prompt = `
Bạn là nhân viên tư vấn xe chuyên nghiệp.

Thông tin người mua:
${JSON.stringify(buyer)}

Danh sách xe:
${JSON.stringify(vehicles)}

Nhiệm vụ:
- Chọn 3 xe phù hợp nhất
- Giải thích rõ vì sao phù hợp
- Ưu tiên:
  + ngân sách
  + mục đích sử dụng
  + tiết kiệm xăng
  + gia đình

Trả về JSON:
{
  "matches": [
    {
      "vehicleId": "...",
      "score": 0-10,
      "reason": "..."
    }
  ]
}
`;

    const result = await model.generateContent(prompt);

    let raw = result.response.text();

    // 🔥 clean JSON mạnh
    raw = raw
      .replace(/```json|```/g, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .trim();

    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Parse AI JSON failed:', raw);
      throw new Error('AI parse failed');
    }
  }

  // ================================
  // 🧠 FALLBACK MATCH (NO AI)
  // ================================
  basicMatch(buyer: any, vehicles: any[]) {
    return vehicles
      .map((v) => {
        let score = 0;

        if (buyer.preferredBrand && v.make === buyer.preferredBrand) score += 3;

        if (buyer.preferredType && v.type === buyer.preferredType) score += 2;

        if (buyer.maxPrice && v.price <= buyer.maxPrice) score += 3;

        if (buyer.minYear && v.year >= buyer.minYear) score += 2;

        if (
          buyer.preferredFeatures &&
          buyer.preferredFeatures.some((f) => v.features?.includes(f))
        )
          score += 2;

        return {
          ...v,
          score,
          reason: 'Phù hợp cơ bản theo tiêu chí của bạn',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  // ================================
  // 💬 FAKE REALTIME STEPS
  // ================================
  getThinkingSteps() {
    return [
      'Đang phân tích nhu cầu của bạn...',
      'Đang tìm xe phù hợp trong hệ thống...',
      'Đang so sánh và chọn xe tốt nhất...',
    ];
  }
}
