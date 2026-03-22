// ================ USERS ===================
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export enum SellerStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
// ================ USERS ===================

// ================ VEHICLES ===================
export enum VehicleMake {
  HONDA = 'HONDA',
  TOYOTA = 'TOYOTA',
  FORD = 'FORD',
  BMW = 'BMW',
  MERCEDES = 'MERCEDES',
}

export enum TransmissionType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  CVT = 'cvt',
}

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  PICKUP = 'pickup',
  HATCHBACK = 'hatchback',
  MPV = 'mpv',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum VehicleCondition {
  NEW = 'new',
  USED = 'used',
}
// ================ VEHICLES ===================

// ================ POSTINGS ===================
export enum PostingStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  RESERVED = 'reserved',
  SOLD = 'sold',
  EXPIRED = 'expired',
  HIDDEN = 'hidden',
  BLOCKED = 'blocked',
}
// ================ POSTINGS ===================
