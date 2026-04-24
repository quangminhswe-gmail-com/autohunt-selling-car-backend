import { Injectable } from '@nestjs/common';
import { VehicleTool } from '../tools/vehicle.tool';
import { GeminiService } from '../llm/gemini.service';

@Injectable()
export class SalesAgent {
  constructor(
    private vehicleTool: VehicleTool,
    private gemini: GeminiService,
  ) {}

  async run(intent: any, seller: any) {
    // =========================
    // 1. GUARD: thiếu info → KHÔNG xử lý
    // =========================
    if (!intent || intent.missingFields?.length > 0) {
      return null; // để ChatService xử lý hỏi
    }

    // =========================
    // 2. QUERY DB
    // =========================
    const cars = await this.vehicleTool.search(intent);

    // =========================
    // 3. KHÔNG CÓ XE → RULE RESPONSE (NO AI)
    // =========================
    if (!cars || cars.length === 0) {
      return this.handleNoCars(intent);
    }

    // =========================
    // 4. CÓ XE → RULE RESPONSE TRƯỚC (FAST)
    // =========================
    const quickReply = this.buildQuickReply(cars);

    // 👉 nếu seller không cần fancy → trả luôn
    if (!seller || seller.sellingPriority === 'LOW') {
      return quickReply;
    }

    // =========================
    // 5. AI ENHANCE (OPTIONAL)
    // =========================
    const prompt = this.buildPrompt(intent, cars, seller);

    const aiReply = await this.safeGenerate(prompt);

    // fallback nếu AI fail
    return aiReply || quickReply;
  }

  // =========================
  // RULE: KHÔNG CÓ XE
  // =========================
  private handleNoCars(intent: any): string {
    return `Hiện tại chưa có xe phù hợp với ngân sách ${
      intent.budget?.toLocaleString() || ''
    } VND.

Bạn có muốn:
- Tăng ngân sách một chút
- Hoặc xem các dòng xe tương tự không?`;
  }

  // =========================
  // RULE: QUICK REPLY (NO AI)
  // =========================
  private buildQuickReply(cars: any[]): string {
    const top = cars.slice(0, 3);

    let reply = 'Mình thấy có vài xe khá phù hợp với bạn:\n';

    top.forEach((car, i) => {
      reply += `\n${i + 1}. ${car.name} - ${car.price?.toLocaleString()} VND`;
    });

    reply += '\n\nBạn muốn mình phân tích chi tiết xe nào không?';

    return reply;
  }

  // =========================
  // BUILD PROMPT (AI)
  // =========================
  private buildPrompt(intent: any, cars: any[], seller: any): string {
    return `
Bạn là nhân viên bán xe chuyên nghiệp.

Phong cách sales: ${seller?.sellingPriority || 'NORMAL'}

Yêu cầu:
- Không dài dòng
- Không marketing quá đà
- Giống nhân viên showroom thật
- Chỉ gợi ý 1-3 xe

Thông tin khách:
- budget: ${intent.budget}
- carType: ${intent.carType}
- passengers: ${intent.passengers}
- purpose: ${intent.purpose}

Danh sách xe:
${JSON.stringify(cars.slice(0, 5))}
`;
  }

  // =========================
  // SAFE AI CALL
  // =========================
  private async safeGenerate(prompt: string): Promise<string | null> {
    try {
      return await this.gemini.generate({
        prompt,
        model: 'gemini-2.5-flash',
        maxTokens: 200,
      });
    } catch (e) {
      return null;
    }
  }
}
