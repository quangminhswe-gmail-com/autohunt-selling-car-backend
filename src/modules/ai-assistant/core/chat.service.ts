import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { GeminiService } from '../llm/gemini.service';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  BuyerProfile,
  BuyerProfileDocument,
} from '@/modules/users/buyer-profile.schema';

import {
  SellerProfile,
  SellerProfileDocument,
} from '@/modules/users/seller-profile.schema';

import { VehicleTool } from '../tools/vehicle.tool';

@Injectable()
export class ChatService {
  private cache = new Map<string, any>();

  private questions: Record<string, string> = {
    budget: 'Bạn muốn mua xe tầm giá bao nhiêu?',
    carType:
      'Vâng, với tầm giá này mình có rất nhiều lựa chọn tốt. Anh/chị dự định mua xe chủ yếu để phục vụ công việc đi lại hàng ngày trong phố, hay để gia đình đi chơi xa dịp cuối tuần ạ?',
    passengers: 'Bạn cần xe mấy chỗ?',
    purpose: 'Bạn mua xe để đi làm, gia đình hay du lịch?',
  };

  constructor(
    private sessionService: SessionService,
    private gemini: GeminiService,
    private vehicleTool: VehicleTool,

    @InjectModel(BuyerProfile.name)
    private buyerModel: Model<BuyerProfileDocument>,

    @InjectModel(SellerProfile.name)
    private sellerModel: Model<SellerProfileDocument>,
  ) {}

  // =========================
  // MAIN HANDLE
  // =========================
  async handle(userId: string, message: string) {
    let session = this.sessionService.get(userId);

    // =========================
    // 1. LOAD PROFILE (1 lần)
    // =========================
    if (!session.buyer) {
      const buyer = await this.buyerModel.findOne({ userId });

      if (buyer) {
        this.sessionService.setBuyer(userId, {
          maxPrice: buyer.maxPrice,
          preferredType: buyer.preferredType,
          usagePurpose: buyer.usagePurpose,
        });

        session = this.sessionService.get(userId);
      }
    }

    if (!session.seller) {
      const seller = await this.sellerModel.findOne({ userId });

      if (seller) {
        this.sessionService.setSeller(userId, {
          id: seller._id.toString(),
        });

        session = this.sessionService.get(userId);
      }
    }

    // =========================
    // 2. SIMPLE RULE (NO AI)
    // =========================
    const quick = this.handleSimple(message, session);
    if (quick) {
      return { reply: quick, intent: session };
    }

    // =========================
    // 3. LOCAL INTENT (QUAN TRỌNG NHẤT)
    // =========================
    const localIntent = this.extractIntentLocal(message);

    // update session bằng local trước
    session = this.sessionService.update(userId, {
      budget: localIntent.budget ?? undefined,
      carType: localIntent.carType ?? undefined,
      passengers: localIntent.passengers ?? undefined,
      purpose: localIntent.purpose ?? undefined,
    });
    // =========================
    // 4. 🔥 USER NHẬP TÊN XE → QUERY DB
    // =========================
    if (this.isCarQuery(message)) {
      const keyword = this.extractKeyword(message);

      const cars = await this.vehicleTool.searchByKeyword(keyword);

      if (!cars || cars.length === 0) {
        return {
          reply: 'Mình chưa tìm thấy xe phù hợp, bạn thử tên khác nhé 🙏',
          intent: session,
        };
      }

      const car = cars[0];

      // lưu context
      session.lastVehicle = car;

      return {
        reply: this.buildCarDetailReply(car),
        intent: session,
      };
    }

    // =========================
    // 4. RULE-BASED RESPONSE (NO AI)
    // =========================
    // if (localIntent.budget || session.budget) {
    //   const reply = this.buildRuleReply(session);

    //   return {
    //     reply,
    //     intent: session,
    //   };
    // }
    // nếu còn thiếu info → hỏi tiếp
    const nextQuestion = this.askDynamicQuestion(session);

    if (nextQuestion) {
      return {
        reply: nextQuestion,
        intent: session,
      };
    }

    // đủ info → mới recommend
    const reply = this.buildRuleReply(session);

    return {
      reply,
      intent: session,
    };

    // =========================
    // 5. CACHE (TRƯỚC KHI GỌI AI)
    // =========================
    const cacheKey = message.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return {
        reply: this.cache.get(cacheKey),
        intent: session,
      };
    }

    // =========================
    // 6. FALLBACK → AI (ÍT KHI DÙNG)
    // =========================
    const aiResult = await this.callAIWithRetry(message, session);

    session = this.sessionService.update(userId, {
      budget: aiResult.budget,
      carType: aiResult.carType,
      passengers: aiResult.passengers,
      purpose: aiResult.purpose,
    });

    this.cache.set(cacheKey, aiResult.reply);

    return {
      reply: aiResult.reply,
      intent: session,
    };
  }

  // =========================
  // RULE-BASED
  // =========================
  private handleSimple(message: string, session: any): string | null {
    const msg = message.toLowerCase();

    if (['ok', 'hi', 'hello', 'cảm ơn'].includes(msg)) {
      return 'Mình luôn sẵn sàng hỗ trợ bạn 😊';
    }

    if (msg.includes('giá') && session.lastVehicle) {
      return `Xe này giá khoảng ${session.lastVehicle.price} VND`;
    }

    return null;
  }

  // =========================
  // AI CALL WITH RETRY
  // =========================
  private async callAIWithRetry(message: string, session: any, retry = 1) {
    try {
      const prompt = this.buildPrompt(message, session);

      const res = await this.gemini.generate({
        prompt,
        model: 'gemini-2.5-flash',
        maxTokens: 200,
      });

      return this.parseAI(res);
    } catch (err: any) {
      const delay = this.extractRetryDelay(err) || 2000;

      if (retry > 0) {
        await new Promise((r) => setTimeout(r, delay));
        return this.callAIWithRetry(message, session, retry - 1);
      }

      // fallback nếu fail
      return {
        budget: null,
        carType: null,
        passengers: null,
        purpose: null,
        reply: 'Hiện tại hệ thống AI đang bận, bạn thử lại sau nhé 🙏',
      };
    }
  }

  // =========================
  // BUILD PROMPT (GỘP INTENT + REPLY)
  // =========================
  private buildPrompt(message: string, session: any): string {
    return `
You are a car sales assistant.

User profile:
- Budget: ${session.budget || 'unknown'}
- Car type: ${session.carType || 'unknown'}
- Passengers: ${session.passengers || 'unknown'}
- Purpose: ${session.purpose || 'unknown'}

Task:
1. Extract missing fields
2. Recommend a suitable car
3. Keep answer short (2-3 sentences)

Return ONLY JSON:
{
  "budget": number | null,
  "carType": string | null,
  "passengers": number | null,
  "purpose": string | null,
  "reply": string
}

User: "${message}"
`;
  }

  // =========================
  // PARSE AI RESPONSE
  // =========================
  private parseAI(text: string) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const clean = text.slice(start, end + 1);

      return JSON.parse(clean);
    } catch {
      return {
        budget: null,
        carType: null,
        passengers: null,
        purpose: null,
        reply: text,
      };
    }
  }

  // =========================
  // EXTRACT RETRY DELAY
  // =========================
  private extractRetryDelay(err: any): number | null {
    const msg = err?.message || '';
    const match = msg.match(/retry in (\d+(\.\d+)?)s/i);

    if (match) {
      return Number(match[1]) * 1000;
    }

    return null;
  }

  private extractIntentLocal(message: string) {
    // const text = message.toLowerCase();
    const text = this.normalizeText(message);

    let budget: number | null = null;

    // const match = text.match(/(\d+)\s*(triệu|tỷ)/);
    const match = text.match(/(\d+(?:\.\d+)?)\s*(tỷ|triệu)/);

    if (match) {
      const value = Number(match[1]);
      const unit = match[2];

      if (unit === 'tỷ') budget = value * 1_000_000_000;
      if (unit === 'triệu') budget = value * 1_000_000;
    }

    let carType: string | null = null;

    if (text.includes('suv')) carType = 'SUV';
    if (text.includes('sedan')) carType = 'Sedan';
    if (text.includes('7 chỗ')) carType = 'SUV';
    if (text.includes('4 chỗ')) carType = 'Sedan';
    if (text.includes('5 chỗ')) carType = 'Sedan';

    let purpose: string | undefined;

    if (text.includes('gia đình')) purpose = 'family';
    if (text.includes('đi làm') || text.includes('cá nhân'))
      purpose = 'personal';
    if (text.includes('dịch vụ')) purpose = 'business';

    // =========================
    // PASSENGERS
    // =========================
    let passengers: number | undefined;

    const peopleMatch = text.match(/(\d+)\s*(người|chỗ)/);
    if (peopleMatch) {
      passengers = Number(peopleMatch[1]);
    }

    return {
      budget,
      carType,
      passengers,
      purpose,
    };
  }

  private buildRuleReply(session: any): string {
    const budget = session.budget;

    if (!budget) {
      return 'Bạn muốn mua xe tầm giá bao nhiêu?';
    }

    if (budget <= 500_000_000) {
      return 'Tầm 500 triệu bạn có thể tham khảo: \n - Kia Morning  \n - Hyundai i10   \n- Toyota Wigo \n Bạn có thể: \n- Gõ tên xe để mình phân tích chi tiết   \n - Hoặc nói dòng xe bạn thích (ví dụ: Mazda, Toyota...) để mình tìm giúp';
    }

    if (budget <= 800_000_000) {
      return 'Bạn có thể cân nhắc Toyota Vios, Hyundai Accent hoặc Mazda 3 🚗';
    }

    if (budget <= 1_500_000_000) {
      return 'Phù hợp với SUV như Mazda CX-5, Hyundai Tucson 👍';
    }

    return 'Bạn có thể xem các dòng cao cấp như Ford Everest hoặc Toyota Fortuner 🚙';
  }

  // private askNextQuestion(session: any): string | null {
  //   const missing = session.missingFields;

  //   if (!missing.length) return null;

  //   const next = missing[0];

  //   return this.questions[next] || null;
  // }
  private askDynamicQuestion(session: any): string | null {
    const { purpose, passengers, carType } = session;

    // =========================
    // CHƯA BIẾT PURPOSE → hỏi trước
    // =========================
    if (!purpose) {
      return 'Bạn mua xe để đi cá nhân hay gia đình ạ?';
    }

    // =========================
    // PURPOSE = FAMILY
    // =========================
    if (purpose === 'family') {
      if (!passengers) {
        return 'Gia đình mình thường đi bao nhiêu người ạ?';
      }

      if (!carType) {
        if (passengers >= 5) {
          return 'Gia đình đông người, bạn có muốn chọn SUV hoặc xe 7 chỗ không?';
        }

        return 'Gia đình ít người, bạn thích sedan hay SUV ạ?';
      }
    }

    // =========================
    // PURPOSE = PERSONAL
    // =========================
    if (purpose === 'personal') {
      if (!carType) {
        return `Bạn đi cá nhân thì sedan sẽ tiết kiệm và dễ di chuyển hơn. 
Nhưng nếu bạn thích gầm cao thì SUV cũng rất ổn.  
Bạn thích kiểu nào hơn ạ?`;
      }
    }

    // =========================
    // PURPOSE = BUSINESS
    // =========================
    if (purpose === 'business') {
      if (!passengers) {
        return 'Bạn chạy dịch vụ thì thường chở bao nhiêu khách ạ?';
      }
    }

    return null; // đủ info
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[,\.]/g, '').replace(/\s+/g, ' ').trim();
  }

  private isCarQuery(message: string): boolean {
    const text = this.normalizeText(message);

    const brands = [
      'acura',
      'alfa romeo',
      'aston martin',
      'audi',
      'bentley',
      'bmw',
      'buick',
      'byd',
      'cadillac',
      'chevrolet',
      'chrysler',
      'citroën',
      'dodge',
      'ferrari',
      'fiat',
      'ford',
      'geely',
      'genesis',
      'gmc',
      'great wall',
      'honda',
      'hyundai',
      'infiniti',
      'isuzu',
      'jaguar',
      'jeep',
      'kia',
      'lamborghini',
      'land rover',
      'lexus',
      'lincoln',
      'lucid',
      'maserati',
      'mazda',
      'mclaren',
      'mercedes-benz',
      'mitsubishi',
      'nio',
      'nissan',
      'peugeot',
      'polestar',
      'porsche',
      'ram',
      'renault',
      'rivian',
      'rolls-royce',
      'subaru',
      'suzuki',
      'tesla',
      'toyota',
      'volkswagen',
      'volvo',
    ];

    return brands.some((b) => text.includes(b));
  }

  private extractKeyword(message: string): string {
    return this.normalizeText(message);
  }

  private buildCarDetailReply(car: any): string {
    //     return `
    // ${car.name} có giá khoảng ${car.price?.toLocaleString()} VND

    // - Loại: ${car.type}
    // - Số chỗ: ${car.seats}

    // 👉 Bạn muốn:
    // - So sánh với xe khác
    // - Xem xe tương tự
    // - Hay hỏi thêm thông tin?
    // `;
    return `
${car.title} có giá khoảng ${car.price.toLocaleString()} ${car.currency}

📍 Khu vực: ${car.locationCity || 'N/A'}

👉 Bạn muốn:
- Xem thêm hình ảnh
- So sánh với xe khác
- Hay mình tư vấn xe tương tự?
`;
  }
}
