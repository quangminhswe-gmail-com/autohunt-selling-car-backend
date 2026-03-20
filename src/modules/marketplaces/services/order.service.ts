import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PostingStatus } from '@/common/constants/enum';

import {
  Order,
  OrderDocument,
  PaymentStatus,
} from '@/modules/marketplaces/schemas/order.schema';
import { CreateOrderDto } from '@/modules/marketplaces/dto/create-order.dto';
import {
  Vehicle,
  VehicleDocument,
} from '@/modules/marketplaces/schemas/vehicle.schema';
import {
  Posting,
  PostingDocument,
} from '@/modules/marketplaces/schemas/posting.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,

    @InjectModel(Posting.name)
    private readonly postingModel: Model<PostingDocument>,
  ) {}

  async createOrder(dto: CreateOrderDto, customerId: string) {
    const vehicle = await this.vehicleModel.findById(dto.vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId.toString() === customerId) {
      throw new BadRequestException('You cannot buy your own vehicle');
    }

    const posting = await this.postingModel.findById(dto.postingId);

    if (!posting) {
      throw new NotFoundException('Posting not found');
    }

    if (posting.status !== 'active') {
      throw new BadRequestException('Posting is not available');
    }

    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customerId');
    }

    const paymentStatus =
      dto.depositAmount && dto.depositAmount > 0
        ? PaymentStatus.PARTIALLY_PAID
        : PaymentStatus.UNPAID;

    const order = new this.orderModel({
      postingId: dto.postingId,
      vehicleId: dto.vehicleId,
      customerId: customerId,
      ownerId: vehicle.ownerId,

      agreedPrice: dto.agreedPrice,
      depositAmount: dto.depositAmount || 0,
      paymentMethod: dto.paymentMethod,

      paymentStatus,

      vehicleSnapshot: {
        make: vehicle.make,
        model: vehicle.model,
        yearOfManufacture: vehicle.yearOfManufacture,
        color: vehicle.color,
        mileage: vehicle.mileage,
      },
    });

    const savedOrder = await order.save();

    await this.postingModel.findByIdAndUpdate(dto.postingId, {
      status: PostingStatus.RESERVED,
    });

    return savedOrder;
  }

  async getMyOrders(customerId: string) {
    return this.orderModel
      .find({ customerId })
      .populate('vehicleId')
      .populate('postingId');
  }

  async getOwnerOrders(ownerId: string) {
    return this.orderModel
      .find({ ownerId })
      .populate('vehicleId')
      .populate('postingId');
  }
}
