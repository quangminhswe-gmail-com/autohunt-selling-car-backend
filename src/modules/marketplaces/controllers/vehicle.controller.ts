import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Req,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { VehicleService } from '../services/vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '@/modules/upload/cloudinary.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicle')
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // UC-ADM01-C ||	AD-ADM01 ||Create Vehicle
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body() dto: CreateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    // return this.vehicleService.createVehicle(dto, req.user.id);
    try {
      console.log('BODY:', dto);
      console.log('FILES:', files);

      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const result: any = await this.cloudinaryService.uploadFile(file);
          return result.secure_url;
        }),
      );

      return this.vehicleService.createVehicle(dto, req.user.id, uploadedUrls);
    } catch (error) {
      console.error('CREATE VEHICLE ERROR:', error);
      throw error;
    }
  }
  // UC-ADM01-C ||	AD-ADM01 ||Create Vehicle

  // UC-ADM01-U	|| AD-ADM01 ||	Update Vehicle
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    const uploadedUrls = files?.length
      ? await Promise.all(
          files.map(async (file) => {
            const result: any = await this.cloudinaryService.uploadFile(file);
            return result.secure_url;
          }),
        )
      : [];

    return this.vehicleService.updateVehicle(
      id,
      dto,
      req.user.id,
      uploadedUrls,
    );
  }
  // UC-ADM01-U	|| AD-ADM01 ||	Update Vehicle

  // UC-ADM01-D ||	AD-ADM01 ||	Delete Vehicle Listing
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.vehicleService.deleteVehicle(id, req.user.id);
  }
  // UC-ADM01-D ||	AD-ADM01 ||	Delete Vehicle Listing

  // UC-ADM01-R	AD-ADM01	Vehicle Listing
  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }
  // UC-ADM01-R	AD-ADM01	Vehicle Listing
}
