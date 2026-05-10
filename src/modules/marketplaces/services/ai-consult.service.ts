// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// import {
//   BuyerProfile,
//   BuyerProfileDocument,
// } from '@/modules/users/buyer-profile.schema';

// import {
//   SellerProfile,
//   SellerProfileDocument,
// } from '@/modules/users/seller-profile.schema';

// import { Posting, PostingDocument } from '../schemas/posting.schema';

// @Injectable()
// export class AiConsultService {
//   private genAI: GoogleGenerativeAI;

//   constructor(
//     @InjectModel(BuyerProfile.name)
//     private buyerModel: Model<BuyerProfileDocument>,

//     @InjectModel(SellerProfile.name)
//     private sellerModel: Model<SellerProfileDocument>,

//     @InjectModel(Posting.name)
//     private postingModel: Model<PostingDocument>,
//   ) {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

//     this.genAI = new GoogleGenerativeAI(apiKey);
//   }

//   // ================================
//   // 🔥 MAIN ENTRY
//   // ================================
//   async consult(userId: string, message: string) {
//     if (!message?.trim()) {
//       throw new InternalServerErrorException('Message is empty');
//     }

//     // 1. Load profile
//     const buyer = await this.buyerModel.findOne({ userId }).lean();
//     const seller = await this.sellerModel.findOne({ userId }).lean();

//     const role = buyer ? 'BUYER' : seller ? 'SELLER' : 'UNKNOWN';

//     // 👉 fallback profile từ message nếu chưa có setting
//     const messageProfile = this.extractFromMessage(message);

//     const profile = {
//       ...(buyer || seller),
//       ...messageProfile,
//     };

//     // 2. Load vehicles
//     const postings = await this.postingModel
//       .find({ status: 'active' })
//       .populate('vehicleId')
//       .limit(30)
//       .lean();

//     const vehicles = postings
//       .filter((p: any) => p.vehicleId)
//       .map((p: any) => ({
//         make: p.vehicleId.make,
//         model: p.vehicleId.model,
//         type: p.vehicleId.type,
//         price: p.price,
//         year: p.vehicleId.yearOfManufacture,
//         color: p.vehicleId.color,
//         ownerId: p.ownerId,
//       }));

//     // 3. 🔥 AI scoring (primary)
//     let scored;

//     try {
//       scored = await this.aiScoreVehicles(profile, message, vehicles);
//     } catch (e) {
//       console.error('AI scoring failed → fallback');

//       // 🔥 fallback rule-based
//       scored = vehicles.map((v) => ({
//         ...v,
//         score: this.scoreVehicle(v, profile),
//         reason: 'rule-based fallback',
//       }));
//     }

//     // 4. sanitize + sort
//     scored = scored.map((v: any) => ({
//       ...v,
//       score: Math.min(100, Math.max(0, v.score || 0)),
//     }));

//     scored.sort((a: any, b: any) => b.score - a.score);

//     const topVehicles = scored.slice(0, 3);

//     // 5. match sellers (simple version)
//     const sellers = topVehicles.map((v: any) => ({
//       userId: v.ownerId,
//     }));

//     // 6. AI trả lời
//     let reply: string;

//     try {
//       reply = await this.askAI({
//         role,
//         profile,
//         message,
//         vehicles: topVehicles,
//       });
//     } catch (e) {
//       reply = this.fallbackReply(topVehicles);
//     }

//     return {
//       steps: this.getThinkingSteps(),
//       matched: topVehicles,
//       sellers,
//       reply,
//     };
//   }

//   // ================================
//   // 🤖 AI SCORING (LLM)
//   // ================================
//   private async aiScoreVehicles(
//     profile: any,
//     message: string,
//     vehicles: any[],
//   ) {
//     const model = this.genAI.getGenerativeModel({
//       model: 'gemini-2.0-flash',
//     });

//     const prompt = `
// Bạn là chuyên gia tư vấn mua xe.

// Thông tin khách:
// ${JSON.stringify(profile)}

// Yêu cầu:
// "${message}"

// Danh sách xe:
// ${JSON.stringify(vehicles)}

// TRẢ VỀ JSON:
// [
//   {
//     "make": "...",
//     "model": "...",
//     "score": number (0-100),
//     "reason": "vì sao phù hợp"
//   }
// ]

// KHÔNG markdown
// KHÔNG text ngoài JSON
// `;

//     const result = await model.generateContent(prompt);
//     let raw = result.response.text();

//     raw = raw
//       .replace(/```json|```/g, '')
//       .replace(/^[^{\[]*/, '')
//       .replace(/[^}\]]*$/, '')
//       .trim();

//     const parsed = JSON.parse(raw);

//     // 🔥 merge lại data gốc (quan trọng)
//     return parsed.map((p: any) => {
//       const found = vehicles.find(
//         (v) => v.make === p.make && v.model === p.model,
//       );

//       return {
//         ...found,
//         score: p.score,
//         reason: p.reason,
//       };
//     });
//   }

//   // ================================
//   // 🧠 RULE-BASED SCORING
//   // ================================
//   private scoreVehicle(vehicle: any, profile: any) {
//     let score = 10; // 👈 base score

//     if (
//       profile?.preferredBrand &&
//       vehicle.make.toLowerCase().includes(profile.preferredBrand.toLowerCase())
//     ) {
//       score += 50; // 👈 tăng mạnh
//     }

//     if (
//       profile?.preferredType &&
//       vehicle.type?.toLowerCase().includes(profile.preferredType)
//     ) {
//       score += 20;
//     }

//     if (profile?.maxPrice && vehicle.price <= profile.maxPrice) {
//       score += 10;
//     }

//     return score;
//   }

//   // ================================
//   // 🧠 PARSE MESSAGE → PROFILE
//   // ================================
//   private extractFromMessage(message: string) {
//     const lower = message.toLowerCase();

//     return {
//       preferredBrand: lower.includes('audi')
//         ? 'Audi'
//         : lower.includes('bmw')
//           ? 'BMW'
//           : null,

//       preferredType: lower.includes('suv')
//         ? 'suv'
//         : lower.includes('sedan')
//           ? 'sedan'
//           : null,
//     };
//   }

//   // ================================
//   // 🤖 AI REPLY (SALESMAN)
//   // ================================
//   private async askAI(data: {
//     role: string;
//     profile: any;
//     message: string;
//     vehicles: any[];
//   }) {
//     const model = this.genAI.getGenerativeModel({
//       model: 'gemini-2.0-flash',
//     });

//     const prompt = `
// Bạn là nhân viên sale xe chuyên nghiệp.

// Thông tin khách:
// ${JSON.stringify(data.profile)}

// Câu hỏi:
// "${data.message}"

// Xe đã được đánh giá:
// ${JSON.stringify(data.vehicles)}

// NHIỆM VỤ:
// - chọn xe tốt nhất
// - dùng "reason" để giải thích
// - nói tự nhiên như người thật
// - hỏi lại 1 câu

// KHÔNG markdown
// `;

//     const result = await model.generateContent(prompt);
//     return result.response.text();
//   }

//   // ================================
//   // 🛟 FALLBACK
//   // ================================
//   private fallbackReply(vehicles: any[]) {
//     if (!vehicles.length) {
//       return 'Hiện tại chưa có xe phù hợp, bạn thử mở rộng tiêu chí nhé.';
//     }

//     const v = vehicles[0];

//     return `Mình thấy ${v.make} ${v.model} khá ổn với bạn.
// Giá ${v.price.toLocaleString()} VND, đời ${v.year}.
// Bạn muốn xem thêm xe khác không?`;
//   }

//   // ================================
//   // 💬 UX
//   // ================================
//   private getThinkingSteps() {
//     return [
//       'Đang phân tích nhu cầu của bạn...',
//       'Đang đánh giá mức độ phù hợp của từng xe...',
//       'Đang chọn lựa phương án tối ưu nhất...',
//     ];
//   }
// }

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
export class AiConsultService {
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
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // ================================
  // 🔥 MAIN
  // ================================
  async consult(userId: string, message: string) {
    if (!message?.trim()) {
      throw new InternalServerErrorException('Message is empty');
    }

    // 1. PROFILE
    const buyer = await this.buyerModel.findOne({ userId }).lean();
    const seller = await this.sellerModel.findOne({ userId }).lean();

    const intent = this.extractIntent(message);

    const profile = {
      ...(buyer || seller),
      ...intent,
    };

    // 2. LOAD ALL DATA (KHÔNG FILTER EARLY)
    const postings = await this.postingModel
      .find({ status: 'active' })
      .populate('vehicleId')
      .limit(100)
      .lean();

    const vehicles = postings
      .filter((p: any) => p.vehicleId)
      .map((p: any) => ({
        make: p.vehicleId.make,
        model: p.vehicleId.model,
        type: p.vehicleId.type,
        price: p.price,
        year: p.vehicleId.yearOfManufacture,
        color: p.vehicleId.color,
        ownerId: p.ownerId,
      }));

    // 3. SCORE ALL
    const scored = vehicles
      .map((v) => ({
        ...v,
        score: this.scoreVehicle(v, intent),
      }))
      .sort((a, b) => b.score - a.score);

    // 4. FORCE BRAND BOOST (IMPORTANT FIX)
    const ranked = this.forceBrandRanking(scored, intent);

    const top = ranked.slice(0, 3);
    const topForSeller = ranked.slice(0, 10);

    // 5. SELLER RANKING (2 CHIỀU)
    const sellers = this.rankSellers(topForSeller);

    // 6. AI RESPONSE
    let reply: string;
    try {
      reply = await this.askAI(message, top);
    } catch {
      reply = this.fallbackReply(top);
    }

    return {
      steps: this.getSteps(),
      matched: top,
      sellers,
      reply,
    };
  }

  // ================================
  // 🧠 INTENT DETECTION
  // ================================
  private extractIntent(message: string) {
    const lower = message.toLowerCase();

    const brands = [
      'mazda',
      'bmw',
      'audi',
      'toyota',
      'honda',
      'mercedes',
      'porsche',
    ];

    const brand = brands.find((b) => lower.includes(b));

    return {
      brand,
      isHardIntent: !!brand,
    };
  }

  // ================================
  // 🧠 SCORING CORE
  // ================================
  private scoreVehicle(vehicle: any, intent: any) {
    let score = 0;

    const vMake = vehicle.make?.toLowerCase();
    const iBrand = intent?.brand?.toLowerCase();

    // 🔥 HARD MATCH (QUAN TRỌNG NHẤT)
    if (iBrand && vMake === iBrand) {
      score += 120;
    }

    // soft match
    if (iBrand && vMake?.includes(iBrand)) {
      score += 80;
    }

    return score;
  }

  // ================================
  // 🔥 FORCE BRAND TOP 1
  // ================================
  private forceBrandRanking(list: any[], intent: any) {
    if (!intent?.brand) return list;

    return list.sort((a, b) => {
      const aMatch = a.make?.toLowerCase() === intent.brand;
      const bMatch = b.make?.toLowerCase() === intent.brand;

      if (aMatch !== bMatch) {
        return Number(bMatch) - Number(aMatch);
      }

      return b.score - a.score;
    });
  }

  // ================================
  // 🧠 SELLER RANKING (2 CHIỀU)
  // ================================
  private rankSellers(vehicles: any[]) {
    const map = new Map<string, any>();

    for (const v of vehicles) {
      if (!map.has(v.ownerId)) {
        map.set(v.ownerId, {
          userId: v.ownerId,
          score: 0,
          vehicles: [],
        });
      }

      const seller = map.get(v.ownerId);
      seller.score += v.score;
      seller.vehicles.push(v);
    }

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        score: s.score / s.vehicles.length + s.vehicles.length * 10, // boost seller có nhiều xe phù hợp
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // ================================
  // 🤖 AI REPLY
  // ================================
  private async askAI(message: string, vehicles: any[]) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const prompt = `
Bạn là chuyên gia tư vấn xe.

User:
"${message}"

Xe phù hợp:
${JSON.stringify(vehicles)}

Hãy chọn xe tốt nhất và giải thích ngắn gọn.
`;

    const res = await model.generateContent(prompt);
    return res.response.text();
  }

  // ================================
  // 🛟 FALLBACK
  // ================================
  private fallbackReply(vehicles: any[]) {
    if (!vehicles.length) {
      return 'Hiện tại chưa có xe phù hợp.';
    }

    const v = vehicles[0];

    return `Mình gợi ý ${v.make} ${v.model}, giá ${v.price.toLocaleString()} VND.`;
  }

  // ================================
  // 💬 UX STEPS
  // ================================
  private getSteps() {
    return [
      'Đang phân tích nhu cầu của bạn...',
      'Đang tìm xe phù hợp...',
      'Đang chọn lựa tốt nhất...',
    ];
  }
}
