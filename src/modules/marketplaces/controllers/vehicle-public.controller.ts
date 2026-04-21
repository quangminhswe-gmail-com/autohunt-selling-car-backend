import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { VehicleService } from '../services/vehicle.service';
import { SearchVehicleDto } from '../dto/search-vehicle.dto';
import { AiSearchService } from '../services/ai-search.service';
import { AiSearchDto } from '../dto/ai-search.dto';

@Controller('public/vehicle')
export class VehiclePublicController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly aiSearchService: AiSearchService,
  ) {}

  @Get()
  getAllVehicles() {
    return this.vehicleService.findAll();
  }

  // UC-CTM-VEH01 || Search Cars (Public)
  @Get('search')
  searchVehicles(@Query() query: SearchVehicleDto) {
    return this.vehicleService.searchVehicles(query);
  }

  @Post('ai-search')
  async aiSearch(@Body() dto: AiSearchDto) {
    return this.aiSearchService.aiSearch(dto.query);
  }
}
