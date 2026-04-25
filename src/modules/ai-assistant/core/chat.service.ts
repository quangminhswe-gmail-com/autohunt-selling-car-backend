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
    // 2. SIMPLE RULE
    // =========================
    const quick = this.handleSimple(message, session);
    if (quick) {
      const recommendedVehicles = await this.vehicleTool.search(session);
      return { reply: quick, intent: session, recommendedVehicles };
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
    const recommendedVehicles = await this.vehicleTool.search(session);

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
        recommendedVehicles: cars.slice(0, 8),
      };
    }

    // nếu còn thiếu info → hỏi tiếp (Gemini diễn đạt)
    const nextQuestion = this.askDynamicQuestion(session);

    if (nextQuestion) {
      return {
        reply: nextQuestion,
        intent: session,
        recommendedVehicles,
      };
    }

    // đủ info → Gemini tư vấn + DB recommendations
    const ruleFallback = this.buildRuleReply(session);
    const reply = await this.generateGeminiReply({
      message,
      session,
      recommendedVehicles,
      fallbackReply: ruleFallback,
    });

    return {
      reply,
      intent: session,
      recommendedVehicles,
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

  private async generateGeminiReply({
    message,
    session,
    recommendedVehicles,
    fallbackReply,
  }: {
    message: string;
    session: any;
    recommendedVehicles: any[];
    fallbackReply: string;
  }): Promise<string> {
    const cacheKey = `${message}|${session?.budget}|${session?.carType}|${session?.purpose}|${session?.passengers}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const topVehicles = recommendedVehicles.slice(0, 3);
    const dbVehicleNames = topVehicles
      .map((item: any) => {
        const vehicle = item?.vehicleId || item?.vehicle || {};
        const title =
          item?.title?.trim() ||
          `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim();
        return title || null;
      })
      .filter(Boolean) as string[];

    const shortlist = topVehicles
      .slice(0, 2)
      .map((item: any) => {
        const vehicle = item?.vehicleId || item?.vehicle || {};
        const title =
          item?.title ||
          `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() ||
          'Mau xe khac';
        return `${title};${Number(item?.price || vehicle?.price || 0)};${vehicle?.type || 'N/A'}`;
      })
      .join('\n');

    const prompt = `
Ban la AI tu van xe.
Tra loi tieng Viet, toi da 2 cau, ngan gon, tu nhien.
TUYET DOI KHONG tu dat ten xe.
KHONG nhac bat ky ten xe nao trong cau tra loi.
Khong markdown, khong JSON.

CTX: b=${session?.budget || 'na'}; t=${session?.carType || 'na'}; s=${session?.passengers || 'na'}; p=${session?.purpose || 'na'}
DB:
${shortlist || 'na'}
USER: ${message}
FALLBACK: ${fallbackReply}
`;

    try {
      const text = await this.gemini.generate({
        prompt,
        model: 'gemini-2.5-flash-lite',
        maxTokens: 90,
      });
      const advisory = (text || '').trim() || fallbackReply;
      const hasDbResults = Array.isArray(recommendedVehicles) && recommendedVehicles.length > 0;
      const dbSuggestion = hasDbResults
        ? dbVehicleNames.length > 0
          ? `Xe phu hop hien co trong database: ${dbVehicleNames.join(', ')}.`
          : 'Mình đã chọn một số xe phù hợp trong database ở bên dưới.'
        : 'Hien chua co mau xe phu hop ro rang trong database, ban thu dieu chinh them ngan sach hoac loai xe.';
      const finalReply = `${advisory} ${dbSuggestion}`.trim();
      this.cache.set(cacheKey, finalReply);
      return finalReply;
    } catch {
      if (dbVehicleNames.length > 0) {
        return `${fallbackReply} Xe phu hop hien co trong database: ${dbVehicleNames.join(', ')}.`;
      }
      return fallbackReply;
    }
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
    if (text.includes('7 chỗ') || text.includes('7 cho')) carType = 'SUV';
    if (text.includes('4 chỗ') || text.includes('4 cho')) carType = 'Sedan';
    if (text.includes('5 chỗ') || text.includes('5 cho')) carType = 'Sedan';

    let purpose: string | undefined;

    if (text.includes('gia đình') || text.includes('gia dinh')) purpose = 'family';
    if (
      text.includes('đi làm') ||
      text.includes('di lam') ||
      text.includes('cá nhân') ||
      text.includes('ca nhan')
    )
      purpose = 'personal';
    if (text.includes('dịch vụ') || text.includes('dich vu')) purpose = 'business';

    // =========================
    // PASSENGERS
    // =========================
    let passengers: number | undefined;

    const peopleMatch = text.match(/(\d+)\s*(người|nguoi|chỗ|cho)/);
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
      return 'Tầm giá này mình sẽ ưu tiên xe gọn, tiết kiệm và dễ bảo dưỡng. Mình đã chọn một số xe đang có trên web phù hợp với nhu cầu của bạn ở bên dưới.';
    }

    if (budget <= 800_000_000) {
      return 'Trong tầm giá này có nhiều lựa chọn sedan/crossover rất hợp đi hằng ngày. Hiện tại web đang có những xe dưới đây phù hợp với nhu cầu của bạn.';
    }

    if (budget <= 1_500_000_000) {
      return 'Với ngân sách này bạn có thể nhắm nhóm SUV/crossover rộng rãi, an toàn và đi đường dài ổn. Hiện tại web đang có những xe dưới đây phù hợp với nhu cầu của bạn.';
    }

    return 'Với ngân sách này bạn có thể xem các lựa chọn SUV/cao cấp hơn, ưu tiên an toàn và tiện nghi. Hiện tại web đang có những xe dưới đây phù hợp với nhu cầu của bạn.';
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
