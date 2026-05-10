import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import {
  Vehicle,
  VehicleDocument,
} from '@/modules/marketplaces/schemas/vehicle.schema';
import { Posting, PostingDocument } from '../schemas/posting.schema';
import { SearchVehicleDto } from '../dto/search-vehicle.dto';
import { PostingStatus } from '@/common/constants/enum';
@Injectable()
export class VehicleService {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,

    @InjectModel(Posting.name)
    private readonly postingModel: Model<PostingDocument>,
  ) {}

  /* ===================== CRUD ===================== */

  async createVehicle(
    dto: CreateVehicleDto,
    ownerId: string,
    images: string[] = [],
  ) {
    try {
      // console.log('DTO:', dto);
      // console.log('IMAGES:', images);
      if (!Types.ObjectId.isValid(ownerId)) {
        throw new BadRequestException('Invalid owner id');
      }

      if (dto.licensePlate) {
        const existingPlate = await this.vehicleModel.findOne({
          licensePlate: dto.licensePlate,
        });

        if (existingPlate) {
          throw new BadRequestException('License plate already exists');
        }
      }

      const existingVin = await this.vehicleModel.findOne({
        vinNumber: dto.vinNumber,
      });

      if (existingVin) {
        throw new BadRequestException('VIN already exists');
      }

      const vehicle = new this.vehicleModel({
        ...dto,
        images,
        ownerId: new Types.ObjectId(ownerId),
      });

      return await vehicle.save();
    } catch (error: unknown) {
      console.error('SAVE ERROR:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(error?.message);
      }
    }
  }
  // UC-ADM01-C ||	AD-ADM01 ||Create Vehicle

  // UC-ADM01-U	|| AD-ADM01 ||	Update Vehicle
  async updateVehicle(
    vehicleId: string,
    dto: UpdateVehicleDto,
    ownerId: string,
    newImages: string[] = [],
  ) {
    const vehicle = await this.vehicleModel.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.ownerId || vehicle.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('No permission');
    }

    let finalImages = vehicle.images || [];

    const removeImages = dto.removeImages || [];

    if (removeImages.length) {
      finalImages = finalImages.filter((img) => !removeImages.includes(img));
    }

    if (newImages.length) {
      finalImages = [...finalImages, ...newImages];
    }

    const { removeImages: _, ...updateData } = dto;

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    Object.assign(vehicle, updateData);
    vehicle.images = finalImages;
    return vehicle.save();
  }
  // UC-ADM01-U	|| AD-ADM01 ||	Update Vehicle

  // UC-ADM01-D ||	AD-ADM01 ||	Delete Vehicle Listing
  async deleteVehicle(vehicleId: string, ownerId: string) {
    const vehicle = await this.vehicleModel.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    if (vehicle.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('Bạn không có quyền xóa xe này');
    }

    const posting = await this.postingModel.findOne({ vehicleId });

    if (posting) {
      throw new BadRequestException('Xe đang có bài đăng, không thể xóa');
    }

    await vehicle.deleteOne();
    return { message: 'Xóa xe thành công' };
  }
  // UC-ADM01-D ||	AD-ADM01 ||	Delete Vehicle Listing

  // UC-ADM01-R	AD-ADM01	Vehicle Listing
  async findAll() {
    const postings = await this.postingModel.find({
      status: PostingStatus.ACTIVE,
    });

    const vehicleIds = postings.map((p) => p.vehicleId);

    return await this.vehicleModel.find({
      _id: { $in: vehicleIds },
    });
  }
  // UC-ADM01-R	AD-ADM01	Vehicle Listing

  //UC-CTM-VEH01	CTM-VEH01	Search Cars
  async searchVehicles(query: SearchVehicleDto) {
    const filter: any = {};

    if (query.keyword) {
      filter.$or = [
        { make: { $regex: query.keyword, $options: 'i' } },
        { model: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    if (query.make) {
      filter.make = query.make;
    }

    if (query.model) {
      filter.model = query.model;
    }

    if (query.fuelType) {
      filter.fuelType = query.fuelType;
    }

    if (query.transmission) {
      filter.transmission = query.transmission;
    }

    if (query.color) {
      filter.color = query.color;
    }

    if (query.year) {
      filter.yearOfManufacture = Number(query.year);
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};

      if (query.minPrice) {
        filter.price.$gte = Number(query.minPrice);
      }

      if (query.maxPrice) {
        filter.price.$lte = Number(query.maxPrice);
      }
    }

    return await this.vehicleModel.find(filter);
  }
  //UC-CTM-VEH01	CTM-VEH01	Search Cars

  async getMyVehicles(ownerId: string) {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner id');
    }

    return await this.vehicleModel
      .find({
        ownerId: new Types.ObjectId(ownerId),
      })
      .sort({ createdAt: -1 });
  }
}
