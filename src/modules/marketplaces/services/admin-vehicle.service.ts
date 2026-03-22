import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

@Injectable()
export class AdminVehicleService {
  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<VehicleDocument>,
  ) {}

  // Admin xem toàn bộ xe
  async findAll() {
    return this.vehicleModel.find().sort({ createdAt: -1 });
  }

  // Admin xem chi tiết xe
  async findById(vehicleId: string) {
    const vehicle = await this.vehicleModel.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  // Admin update bất kỳ xe nào
  async updateVehicle(
    vehicleId: string,
    dto: UpdateVehicleDto,
    newImages: string[] = [],
  ) {
    const vehicle = await this.vehicleModel.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (newImages.length > 0) {
      vehicle.images = [...vehicle.images, ...newImages];
    }

    Object.assign(vehicle, dto);

    return vehicle.save();
  }

  // Admin xóa bất kỳ xe nào
  async deleteVehicle(vehicleId: string) {
    const vehicle = await this.vehicleModel.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.vehicleModel.findByIdAndDelete(vehicleId);
  }
}
