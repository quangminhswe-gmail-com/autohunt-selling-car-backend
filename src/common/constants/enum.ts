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
  ACURA = 'Acura',
  ALFA_ROMEO = 'Alfa Romeo',
  ASTON_MARTIN = 'Aston Martin',
  AUDI = 'Audi',
  BENTLEY = 'Bentley',
  BMW = 'BMW',
  BUICK = 'Buick',
  BYD = 'BYD',
  CADILLAC = 'Cadillac',
  CHEVROLET = 'Chevrolet',
  CHRYSLER = 'Chrysler',
  CITROEN = 'Citroën',
  DODGE = 'Dodge',
  FERRARI = 'Ferrari',
  FIAT = 'Fiat',
  FORD = 'Ford',
  GEELY = 'Geely',
  GENESIS = 'Genesis',
  GMC = 'GMC',
  GREAT_WALL = 'Great Wall',
  HONDA = 'Honda',
  HYUNDAI = 'Hyundai',
  INFINITI = 'Infiniti',
  ISUZU = 'Isuzu',
  JAGUAR = 'Jaguar',
  JEEP = 'Jeep',
  KIA = 'Kia',
  LAMBORGHINI = 'Lamborghini',
  LAND_ROVER = 'Land Rover',
  LEXUS = 'Lexus',
  LINCOLN = 'Lincoln',
  LUCID = 'Lucid',
  MASERATI = 'Maserati',
  MAZDA = 'Mazda',
  MCLAREN = 'McLaren',
  MERCEDES_BENZ = 'Mercedes-Benz',
  MITSUBISHI = 'Mitsubishi',
  NIO = 'NIO',
  NISSAN = 'Nissan',
  PEUGEOT = 'Peugeot',
  POLESTAR = 'Polestar',
  PORSCHE = 'Porsche',
  RAM = 'Ram',
  RENAULT = 'Renault',
  RIVIAN = 'Rivian',
  ROLLS_ROYCE = 'Rolls-Royce',
  SUBARU = 'Subaru',
  SUZUKI = 'Suzuki',
  TESLA = 'Tesla',
  TOYOTA = 'Toyota',
  VOLKSWAGEN = 'Volkswagen',
  VOLVO = 'Volvo',
  VINFAST = 'VinFast',
}

export enum TransmissionType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  CVT = 'cvt',
  DUAL_CLUTCH = 'dual-clutch',
  SEMI_AUTOMATIC = 'semi-automatic',
  AMT = 'amt',
}

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  COUPE = 'coupe',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon',
  PICKUP_TRUCK = 'pickup truck',
  MINIVAN = 'minivan',
  CROSSOVER = 'crossover',
  ROADSTER = 'roadster',
  VAN = 'van',
  LUXURY_SEDAN = 'luxury sedan',
  SPORTS_CAR = 'sports car',
  COMPACT_CAR = 'compact car',
  MIDSIZE_CAR = 'midsize car',
  FULL_SIZE_CAR = 'full-size car',
  SUBCOMPACT_CAR = 'subcompact car',
  MPV = 'mpv',
}

export enum FuelType {
  PETROL = 'petrol',
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  PLUG_IN_HYBRID = 'plug-in hybrid',
  CNG = 'cng',
  LPG = 'lpg',
  HYDROGEN = 'hydrogen',
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
