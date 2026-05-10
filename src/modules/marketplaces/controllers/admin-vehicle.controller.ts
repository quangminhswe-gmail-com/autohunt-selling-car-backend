import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

import { CloudinaryService } from '@/modules/upload/cloudinary.service';
import { AdminVehicleService } from '../services/admin-vehicle.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/vehicle')
export class AdminVehicleController {
  constructor(
    private readonly adminVehicleService: AdminVehicleService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Admin xem toàn bộ xe
  @Get()
  findAllVehicles() {
    return this.adminVehicleService.findAll();
  }

  // Admin xem chi tiết 1 xe
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminVehicleService.findById(id);
  }

  // Admin update bất kỳ xe nào
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploadedUrls = files?.length
      ? await Promise.all(
          files.map(async (file) => {
            const result: any = await this.cloudinaryService.uploadFile(file);
            return result.secure_url;
          }),
        )
      : [];

    return this.adminVehicleService.updateVehicle(id, dto, uploadedUrls);
  }

  // Admin xóa bất kỳ xe nào
  @Delete(':id')
  deleteVehicle(@Param('id') id: string) {
    return this.adminVehicleService.deleteVehicle(id);
  }
}
