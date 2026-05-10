// services/ai-search.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema';

@Injectable()
export class AiSearchService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<VehicleDocument>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private fallbackParse(text: string) {
    const lower = text.toLowerCase();
    const yearMatch = lower.match(/\b20\d{2}\b/);
    return {
      brand: lower.includes('toyota')
        ? 'Toyota'
        : lower.includes('honda')
          ? 'Honda'
          : null,

      type: lower.includes('suv')
        ? 'SUV'
        : lower.includes('sedan')
          ? 'sedan'
          : null,

      min_price: lower.includes('800') ? 700000000 : null,
      max_price: lower.includes('800') ? 900000000 : null,

      min_year: yearMatch ? parseInt(yearMatch[0]) : null,
    };
  }

  // ================================
  // 🔥 1. Parse user input bằng Gemini (multi-model + retry)
  // ================================
  async parseQuery(text: string): Promise<any> {
    const models = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
    ];

    const prompt = `
Bạn là hệ thống trích xuất dữ liệu.

NHIỆM VỤ:
Trích xuất thông tin tìm xe từ câu người dùng.

QUAN TRỌNG:
- CHỈ trả về JSON hợp lệ
- KHÔNG thêm bất kỳ chữ nào khác
- KHÔNG giải thích
- KHÔNG markdown

JSON format:
{
  "brand": string | null,
  "type": string | null,
  "min_price": number | null,
  "max_price": number | null,
  "min_year": number | null
}

QUY TẮC:
- "toyota" → "Toyota"
- "suv" → "SUV"
- "800 triệu" → min=700000000, max=900000000
- "1 tỷ" → 1000000000
- Nếu không có → null

VÍ DỤ:
Input: tôi muốn mua xe toyota suv tầm 800 triệu đời 2020

Output:
{
  "brand": "Toyota",
  "type": "SUV",
  "min_price": 700000000,
  "max_price": 900000000,
  "min_year": 2020
}

INPUT:
${text}
`;

    for (const modelName of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
          });

          const result = (await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AI timeout')), 3000),
            ),
          ])) as any;

          let raw = result.response.text();

          // 🔥 remove markdown
          raw = raw
            .replace(/```json|```/g, '')
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '')
            .trim();

          const parsed = JSON.parse(raw);

          // 🔥 validate structure
          if (typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure');
          }

          return {
            brand: parsed.brand ?? null,
            type: parsed.type ?? null,
            min_price: parsed.min_price ?? null,
            max_price: parsed.max_price ?? null,
            min_year: parsed.min_year ?? null,
          };
        } catch (error: any) {
          console.error(
            `[AI SEARCH ERROR] model=${modelName} attempt=${attempt}`,
            error?.message,
          );

          if (attempt === 2) break;
        }
      }
    }

    // 🔥 fallback cuối cùng (không crash)
    return {
      brand: null,
      type: null,
      min_price: null,
      max_price: null,
      min_year: null,
    };
  }

  // ================================
  // 🔥 2. Build Mongo query
  // ================================
  buildQuery(q: any) {
    return {
      ...(q.brand && {
        make: { $regex: q.brand.trim(), $options: 'i' },
      }),
      ...(q.type && {
        type: { $regex: q.type.trim(), $options: 'i' },
      }),
      ...(q.min_price &&
        q.max_price && {
          price: {
            $gte: q.min_price,
            $lte: q.max_price,
          },
        }),
      ...(q.min_year && {
        year: { $gte: q.min_year },
      }),
    };
  }

  // ================================
  // 🔥 3. Main AI search
  // ================================
  async aiSearch(userInput: string) {
    if (!userInput || userInput.trim() === '') {
      throw new InternalServerErrorException('Query is empty');
    }

    const parsed = await this.parseQuery(userInput);

    if (
      !parsed.brand &&
      !parsed.type &&
      !parsed.min_price &&
      !parsed.min_year
    ) {
      console.log('AI failed → fallback parser');
      Object.assign(parsed, this.fallbackParse(userInput));
    }

    const mongoQuery = this.buildQuery(parsed);

    let vehicles = await this.vehicleModel.find(mongoQuery).limit(10).lean();

    // 🔥 fallback nếu không có kết quả
    if (!vehicles.length) {
      vehicles = await this.vehicleModel
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    // 🔥 ranking theo giá gần nhất
    if (parsed.min_price) {
      vehicles.sort(
        (a, b) =>
          Math.abs(a.price - parsed.min_price) -
          Math.abs(b.price - parsed.min_price),
      );
    }

    return {
      parsed,
      total: vehicles.length,
      vehicles,
    };
  }
}
