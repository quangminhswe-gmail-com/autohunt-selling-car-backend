import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PostingStatus } from '@/common/constants/enum';
import { OrderStatus, DeliveryStatus } from '../schemas/order.schema';
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
import { UpdateDeliveryStatusDto } from '../dto/update-delivery-status.dto';

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
      .populate({
        path: 'vehicleId',
        select: 'images price',
      })
      .populate({
        path: 'postingId',
        select: 'title status',
      })
      .populate({
        path: 'ownerId',
        select: 'email',
      })
      .select('-customerId -__v')
      .sort({ createdAt: -1 });
  }

  async getOwnerOrders(ownerId: string) {
    return this.orderModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .populate({
        path: 'vehicleId',
        select: 'make model images price',
      })
      .populate({
        path: 'postingId',
        select: 'title status',
      })
      .populate({
        path: 'customerId',
        select: 'email',
      })
      .populate({
        path: 'ownerId',
        select: 'email',
      })
      .select('-__v')
      .sort({ createdAt: -1 });
  }

  async trackDelivery(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'vehicleId',
        select: 'make model images',
      })
      .populate({
        path: 'postingId',
        select: 'title',
      });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.customerId.toString() !== userId &&
      order.ownerId.toString() !== userId
    ) {
      throw new ForbiddenException('No permission');
    }

    return {
      orderId: order._id,
      posting: order.postingId,
      vehicle: order.vehicleId,
      deliveryStatus: order.deliveryStatus,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
    };
  }

  async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    ownerId: string,
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('No permission');
    }

    order.orderStatus = orderStatus;

    if (
      orderStatus === OrderStatus.COMPLETED &&
      order.deliveryStatus !== DeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException('Car must be delivered first');
    }

    if (orderStatus === OrderStatus.COMPLETED) {
      order.completedAt = new Date();

      await this.postingModel.findByIdAndUpdate(order.postingId, {
        status: PostingStatus.SOLD,
      });
    }

    if (orderStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();

      await this.postingModel.findByIdAndUpdate(order.postingId, {
        status: PostingStatus.ACTIVE,
      });
    }

    return await order.save();
  }

  async updateDeliveryStatus(
    orderId: string,
    dto: UpdateDeliveryStatusDto,
    ownerId: string,
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('No permission');
    }

    order.deliveryStatus = dto.deliveryStatus;

    if (
      order.deliveryStatus === DeliveryStatus.NOT_DELIVERED &&
      dto.deliveryStatus === DeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException('Must go through delivering first');
    }

    if (dto.deliveryStatus === DeliveryStatus.DELIVERED) {
      order.orderStatus = OrderStatus.COMPLETED;
      order.completedAt = new Date();

      await this.postingModel.findByIdAndUpdate(order.postingId, {
        status: PostingStatus.SOLD,
      });
    }

    return await order.save();
  }
}
