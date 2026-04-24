import { Injectable } from '@nestjs/common';

type MissingField = 'budget' | 'carType' | 'passengers' | 'purpose';

// ✅ DTO nhẹ (không dùng Document nặng)
export type BuyerInfo = {
  maxPrice?: number;
  preferredType?: string;
  usagePurpose?: string;
};

export type SellerInfo = {
  id?: string;
  name?: string;
};

export type Session = {
  userId: string;

  budget?: number;
  carType?: string;
  passengers?: number;
  purpose?: string;

  buyer?: BuyerInfo | null;
  seller?: SellerInfo | null;

  lastVehicle?: any;

  missingFields: MissingField[];
};

@Injectable()
export class SessionService {
  private sessions = new Map<string, Session>();

  // =========================
  // GET SESSION
  // =========================
  get(userId: string): Session {
    const existing = this.sessions.get(userId);
    if (existing) return existing;

    const init: Session = {
      userId,

      budget: undefined,
      carType: undefined,
      passengers: undefined,
      purpose: undefined,

      buyer: null,
      seller: null,
      lastVehicle: null,

      missingFields: ['budget', 'carType', 'passengers', 'purpose'],
    };

    this.sessions.set(userId, init);
    return init;
  }

  // =========================
  // UPDATE SESSION (SAFE + KEEP DATA)
  // =========================
  update(userId: string, data: Partial<Session>): Session {
    const old = this.get(userId);

    const merged: Session = {
      ...old, // ✅ giữ toàn bộ field cũ

      budget: this.pickNumber(data.budget, old.budget),
      carType: this.pickString(data.carType, old.carType),
      passengers: this.pickNumber(data.passengers, old.passengers),
      purpose: this.pickString(data.purpose, old.purpose),

      // 👇 merge object (không overwrite)
      buyer: data.buyer ?? old.buyer,
      seller: data.seller ?? old.seller,
      lastVehicle: data.lastVehicle ?? old.lastVehicle,

      missingFields: [],
    };

    merged.missingFields = this.getMissingFields(merged);

    this.sessions.set(userId, merged);

    return merged;
  }

  // =========================
  // NORMALIZERS
  // =========================
  private pickNumber(newVal: any, oldVal?: number): number | undefined {
    if (newVal === null || newVal === undefined || newVal === '') return oldVal;

    // 👇 xử lý string kiểu "1 tỷ", "800 triệu"
    if (typeof newVal === 'string') {
      const lower = newVal.toLowerCase();

      let multiplier = 1;

      if (lower.includes('tỷ')) multiplier = 1_000_000_000;
      else if (lower.includes('triệu')) multiplier = 1_000_000;

      const cleaned = lower.replace(/[^\d]/g, '');
      const n = Number(cleaned);

      if (!isNaN(n) && n > 0) {
        return n * multiplier;
      }
    }

    const n = Number(newVal);
    if (!isNaN(n) && n > 0) return n;

    return oldVal;
  }

  private pickString(newVal: any, oldVal?: string): string | undefined {
    if (newVal === null || newVal === undefined) return oldVal;

    const s = String(newVal).trim();
    if (!s) return oldVal;

    return s;
  }

  // =========================
  // MISSING FIELD DETECTION
  // =========================
  private getMissingFields(session: Session): MissingField[] {
    const missing: MissingField[] = [];

    if (session.budget == null || session.budget <= 0) {
      missing.push('budget');
    }

    if (!session.carType || session.carType.trim() === '') {
      missing.push('carType');
    }

    if (session.passengers == null || session.passengers <= 0) {
      missing.push('passengers');
    }

    if (!session.purpose || session.purpose.trim() === '') {
      missing.push('purpose');
    }

    return missing;
  }

  // =========================
  // SET BUYER (OPTIMIZED)
  // =========================
  setBuyer(userId: string, buyer: BuyerInfo) {
    const session = this.get(userId);

    session.buyer = buyer;

    // auto fill nếu chưa có
    if (!session.budget && buyer.maxPrice) {
      session.budget = buyer.maxPrice;
    }

    if (!session.carType && buyer.preferredType) {
      session.carType = buyer.preferredType;
    }

    if (!session.purpose && buyer.usagePurpose) {
      session.purpose = buyer.usagePurpose;
    }

    session.missingFields = this.getMissingFields(session);

    this.sessions.set(userId, session);

    return session;
  }

  // =========================
  // SET SELLER
  // =========================
  setSeller(userId: string, seller: SellerInfo) {
    const session = this.get(userId);

    session.seller = seller;

    this.sessions.set(userId, session);

    return session;
  }

  // =========================
  // RESET
  // =========================
  reset(userId: string) {
    this.sessions.delete(userId);
  }
}
