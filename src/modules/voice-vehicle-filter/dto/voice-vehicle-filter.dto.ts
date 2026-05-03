import { IsOptional, IsString } from 'class-validator';

export class VoiceVehicleFilterDto {
  @IsOptional()
  @IsString()
  utterance?: string;
}

export class VehicleFilterPayload {
  reset?: boolean;
  searchQuery?: string;
  selectedMakes?: string[];
  selectedTypes?: string[];
  selectedYear?: string;
  selectedTransmissions?: string[];
  selectedFuelTypes?: string[];
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
}

export class VehicleVoiceParseResponse {
  ok: boolean;
  filters: VehicleFilterPayload;
  criteriaCount: number;
  criteriaKeys: Array<keyof VehicleFilterPayload>;
}