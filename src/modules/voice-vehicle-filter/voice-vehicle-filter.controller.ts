import { Body, Controller, Post } from '@nestjs/common';
import { VoiceVehicleFilterDto, VehicleVoiceParseResponse } from './dto/voice-vehicle-filter.dto';
import { VoiceVehicleFilterService } from './voice-vehicle-filter.service';

@Controller('voice-vehicle-filter')
export class VoiceVehicleFilterController {
  constructor(private readonly voiceVehicleFilterService: VoiceVehicleFilterService) {}

  @Post()
  parseVoiceFilter(@Body() body: VoiceVehicleFilterDto): VehicleVoiceParseResponse {
    const utterance = String(body.utterance || '').trim();
    return this.voiceVehicleFilterService.parseVoiceFilter(utterance);
  }
}