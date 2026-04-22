export class UserSettingsDto {
  role: 'BUYER' | 'SELLER';

  // buyer
  preferredBrand?: string;
  preferredType?: string;
  preferredColor?: string;
  minYear?: number;
  maxPrice?: number;
  preferredFeatures?: string[];
  usagePurpose?: string;

  // seller
  sellingPriority?: 'FAST_SALE' | 'BEST_PRICE' | 'NORMAL';
  isNegotiable?: boolean;
  preferredBuyerType?: 'INDIVIDUAL' | 'BUSINESS' | 'ANY';
}
