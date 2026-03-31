import { Controller, Get, Param, Query } from '@nestjs/common';
import { VehicleService } from '../services/vehicle.service';
import { SearchVehicleDto } from '../dto/search-vehicle.dto';

@Controller('public/vehicle')
export class VehiclePublicController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  getAllVehicles() {
    return this.vehicleService.findAll();
  }

  // UC-CTM-VEH01 || Search Cars (Public)
  @Get('search')
  searchVehicles(@Query() query: SearchVehicleDto) {
    return this.vehicleService.searchVehicles(query);
  }
}
