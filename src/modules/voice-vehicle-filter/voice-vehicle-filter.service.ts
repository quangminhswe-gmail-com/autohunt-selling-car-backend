import { Injectable } from '@nestjs/common';
import { VehicleFilterPayload, VehicleVoiceParseResponse } from './dto/voice-vehicle-filter.dto';

@Injectable()
export class VoiceVehicleFilterService {
  private readonly POPULAR_BRANDS = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
    'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti',
    'Tesla', 'Porsche', 'Ferrari', 'Lamborghini', 'Jaguar', 'Land Rover', 'Volvo',
    'Chrysler', 'Dodge', 'Jeep', 'Ram', 'GMC', 'Cadillac', 'Lincoln', 'Buick',
    'Mitsubishi', 'Suzuki', 'Isuzu', 'Peugeot', 'Renault', 'Citroën', 'Fiat',
    'Alfa Romeo', 'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren',
    'Genesis', 'Polestar', 'Rivian', 'Lucid', 'NIO', 'BYD', 'Geely', 'Great Wall',
  ];

  private readonly BODY_TYPES = [
    'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup Truck',
    'Minivan', 'Crossover', 'Roadster', 'Van', 'Luxury Sedan', 'Sports Car',
    'Compact Car', 'Midsize Car', 'Full-size Car', 'Subcompact Car',
  ];

  private readonly TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Dual-Clutch', 'Semi-Automatic', 'AMT'];
  private readonly FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'CNG', 'LPG', 'Hydrogen'];

  private stripDiacritics(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  private normalize(value: string): string {
    return this.stripDiacritics(String(value || ''))
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  private parseMoneyVnd(cmd: string): { min?: number; max?: number } {
    const toNumber = (raw: string, unit: string): number | null => {
      const n = Number(raw.replaceAll('.', '').replaceAll(',', ''));
      if (!Number.isFinite(n)) return null;
      if (unit.includes('ty') || unit.includes('tỷ')) return Math.round(n * 1_000_000_000);
      if (unit.includes('trieu')) return Math.round(n * 1_000_000);
      if (unit.includes('k') || unit.includes('nghin') || unit.includes('nghìn')) return Math.round(n * 1_000);
      return Math.round(n);
    };

    const parseAmount = (text: string): number | null => {
      const matches = Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)/gi));
      if (!matches.length) return null;

      let total = 0;
      for (const match of matches) {
        const raw = match[1];
        const unit = match[2];
        const value = toNumber(raw, unit);
        if (value == null) return null;
        total += value;
      }

      return total;
    };

    const range = cmd.match(/\btu\s+(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)\s+den\s+(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)\b/);
    if (range) {
      const a = toNumber(range[1], range[2]);
      const b = toNumber(range[3], range[4]);
      if (a != null && b != null) return { min: Math.min(a, b), max: Math.max(a, b) };
    }

    const under = cmd.match(/\b(duoi|<=|nho hon|thap hon)\s+(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)\b/);
    if (under) {
      const v = parseAmount(under[2] + ' ' + under[3]);
      if (v != null) return { max: v };
    }

    const over = cmd.match(/\b(tren|>=|lon hon|cao hon)\s+(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)\b/);
    if (over) {
      const v = parseAmount(over[2] + ' ' + over[3]);
      if (v != null) return { min: v };
    }

    const approx = cmd.match(/\b(khoang|khoảng|tam|tầm)\s+(\d+(?:[.,]\d+)?)\s*(ty|tỷ|trieu|triệu)\b/);
    if (approx) {
      const v = parseAmount(approx[2] + ' ' + approx[3]);
      if (v != null) {
        const delta = Math.max(50_000_000, Math.round(v * 0.1));
        return { min: Math.max(0, v - delta), max: v + delta };
      }
    }

    const composite = parseAmount(cmd);
    if (composite != null) {
      const delta = Math.max(50_000_000, Math.round(composite * 0.1));
      return { min: Math.max(0, composite - delta), max: composite + delta };
    }

    return {};
  }

  private heuristicParse(utterance: string): VehicleFilterPayload {
    const cmd = this.normalize(utterance);

    if (/\b(reset|xoa loc|xoa bo loc|bo loc|lam lai|clear filters?)\b/.test(cmd)) {
      return { reset: true };
    }

    const selectedMakes: string[] = [];
    for (const make of this.POPULAR_BRANDS) {
      const m = this.normalize(make);
      if (m && cmd.includes(m)) selectedMakes.push(make);
    }

    const selectedTypes: string[] = [];
    for (const type of this.BODY_TYPES) {
      const t = this.normalize(type);
      if (t && cmd.includes(t)) selectedTypes.push(type);
    }
    if (cmd.includes('ban tai') || cmd.includes('pickup') || cmd.includes('pick up')) selectedTypes.push('Pickup Truck');
    if (cmd.includes('xe van')) selectedTypes.push('Van');
    if (cmd.includes('xe the thao')) selectedTypes.push('Sports Car');

    const selectedTransmissions: string[] = [];
    if (cmd.includes('so san') || cmd.includes('manual')) selectedTransmissions.push('Manual');
    if (cmd.includes('tu dong') || cmd.includes('automatic')) selectedTransmissions.push('Automatic');
    if (cmd.includes('cvt')) selectedTransmissions.push('CVT');

    const selectedFuelTypes: string[] = [];
    if (cmd.includes('xang') || cmd.includes('gasoline')) selectedFuelTypes.push('Gasoline');
    if (cmd.includes('dau') || cmd.includes('diesel')) selectedFuelTypes.push('Diesel');
    if (cmd.includes('dien') || cmd.includes('electric')) selectedFuelTypes.push('Electric');
    if (cmd.includes('hybrid')) selectedFuelTypes.push('Hybrid');

    const yearMatch = cmd.match(/\b(19\d{2}|20\d{2})\b/);
    const selectedYear = yearMatch ? yearMatch[1] : undefined;

    const money = this.parseMoneyVnd(cmd);
    const minPrice = money.min != null ? String(money.min) : undefined;
    const maxPrice = money.max != null ? String(money.max) : undefined;

    let sortBy: string | undefined;
    if (cmd.includes('gia thap') || cmd.includes('re nhat') || cmd.includes('gia tang dan')) sortBy = 'price-low';
    if (cmd.includes('gia cao') || cmd.includes('dat nhat') || cmd.includes('gia giam dan')) sortBy = 'price-high';
    if (cmd.includes('moi nhat') || cmd.includes('gan day') || cmd.includes('newest')) sortBy = 'newest';

    const removePatterns = (value: string, patterns: RegExp[]): string => {
      let out = value;
      for (const p of patterns) out = out.replace(p, ' ');
      return out.replace(/\s+/g, ' ').trim();
    };

    const structuredPatterns: RegExp[] = [
      /\b(doi|đoi|đời|nam|năm)\s*(19\d{2}|20\d{2})\b/gi,
      /\b(19\d{2}|20\d{2})\b/g,
      /\btu\s+\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\s+den\s+\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\b/gi,
      /\b(duoi|<=|nho hon|thap hon)\s+\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\b/gi,
      /\b(tren|>=|lon hon|cao hon)\s+\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\b/gi,
      /\b(khoang|khoảng|tam|tầm)\s+\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\b/gi,
      /\b\d+(?:[.,]\d+)?\s*(ty|tỷ|trieu|triệu)\b/gi,
      /\b(so san|so tu dong|tu dong|manual|automatic|cvt|hybrid|diesel|gasoline|electric|xang|dau|dien)\b/gi,
    ];

    let residual = removePatterns(cmd, structuredPatterns);

    for (const make of selectedMakes) {
      const m = this.normalize(make);
      if (m) residual = removePatterns(residual, [new RegExp(`\\b${m}\\b`, 'g')]);
    }
    for (const type of selectedTypes) {
      const t = this.normalize(type);
      if (t) residual = removePatterns(residual, [new RegExp(`\\b${t}\\b`, 'g')]);
    }

    residual = removePatterns(residual, [
      /\b(tim|tìm|search|loc|lọc|xe|oto|o to|giup toi|cho toi|hay|lam on|mo|mở|vao|di|den|toi)\b/gi,
    ]);

    const residualTokens = residual.split(' ').filter(Boolean);
    const hasMeaningfulResidual =
      residualTokens.length > 0 &&
      !residualTokens.every((t) => ['nam', 'năm', 'doi', 'đời', 'xe'].includes(t));

    const searchQuery = hasMeaningfulResidual ? residual : undefined;

    return {
      searchQuery: searchQuery || undefined,
      selectedMakes: this.uniq(selectedMakes),
      selectedTypes: this.uniq(selectedTypes),
      selectedYear,
      selectedTransmissions: this.uniq(selectedTransmissions),
      selectedFuelTypes: this.uniq(selectedFuelTypes),
      minPrice,
      maxPrice,
      sortBy,
    };
  }

  private countCriteria(filters: VehicleFilterPayload): { criteriaCount: number; criteriaKeys: Array<keyof VehicleFilterPayload> } {
    const keys: Array<keyof VehicleFilterPayload> = [];
    const hasArr = (v?: string[]) => Array.isArray(v) && v.length > 0;
    const hasStr = (v?: string) => typeof v === 'string' && v.trim().length > 0;

    if (filters.reset) keys.push('reset');
    if (hasStr(filters.selectedYear)) keys.push('selectedYear');
    if (hasStr(filters.minPrice) || hasStr(filters.maxPrice)) {
      if (hasStr(filters.minPrice)) keys.push('minPrice');
      if (hasStr(filters.maxPrice)) keys.push('maxPrice');
    }
    if (hasArr(filters.selectedMakes)) keys.push('selectedMakes');
    if (hasArr(filters.selectedTypes)) keys.push('selectedTypes');
    if (hasArr(filters.selectedTransmissions)) keys.push('selectedTransmissions');
    if (hasArr(filters.selectedFuelTypes)) keys.push('selectedFuelTypes');
    if (hasStr(filters.searchQuery)) keys.push('searchQuery');
    if (hasStr(filters.sortBy)) keys.push('sortBy');

    let count = 0;
    if (filters.reset) count += 1;
    if (hasStr(filters.selectedYear)) count += 1;
    if (hasStr(filters.minPrice) || hasStr(filters.maxPrice)) count += 1;
    if (hasArr(filters.selectedMakes)) count += 1;
    if (hasArr(filters.selectedTypes)) count += 1;
    if (hasArr(filters.selectedTransmissions)) count += 1;
    if (hasArr(filters.selectedFuelTypes)) count += 1;
    if (hasStr(filters.searchQuery)) count += 1;
    if (hasStr(filters.sortBy)) count += 1;

    return { criteriaCount: count, criteriaKeys: Array.from(new Set(keys)) };
  }

  parseVoiceFilter(utterance: string): VehicleVoiceParseResponse {
    if (!utterance.trim()) {
      return { ok: false, filters: {}, criteriaCount: 0, criteriaKeys: [] };
    }

    const filters = this.heuristicParse(utterance);
    const meta = this.countCriteria(filters);
    return { ok: true, filters, ...meta };
  }
}