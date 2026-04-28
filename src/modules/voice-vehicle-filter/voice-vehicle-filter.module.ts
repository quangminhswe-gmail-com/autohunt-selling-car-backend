import { Module } from '@nestjs/common';
import { VoiceVehicleFilterController } from './voice-vehicle-filter.controller';
import { VoiceVehicleFilterService } from './voice-vehicle-filter.service';

@Module({
  controllers: [VoiceVehicleFilterController],
  providers: [VoiceVehicleFilterService],
})
export class VoiceVehicleFilterModule {}