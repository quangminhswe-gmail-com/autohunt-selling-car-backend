import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import { User, UserDocument } from '@/modules/users/user.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateNotificationByEmailDto } from './dto/create-notification-by-email.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateNotificationDto, adminId: string) {
    const notification = new this.notificationModel({
      ...dto,
      createdBy: new Types.ObjectId(adminId),
      isSent: true,
    });

    return await notification.save();
  }

  async getLogs() {
    return await this.notificationModel
      .find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  async getForCustomer(role: string, userId: string) {
    return await this.notificationModel
      .find({
        $or: [
          { targetRole: 'all' },
          { targetRole: role, targetUserId: null },
          { targetUserId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 });
  }

  async deleteNotification(id: string) {
    const deleted = await this.notificationModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Deleted successfully',
    };
  }

  async createNotificationByEmail(
    email: string,
    dto: CreateNotificationByEmailDto,
    adminId: string,
  ) {
    if (dto.targetRole === 'all') {
      throw new BadRequestException('Cannot send to ALL when using email');
    }

    const user = await this.userModel.findOne({ email }).select('_id');

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    const { email: _, ...rest } = dto;

    const notification = new this.notificationModel({
      ...rest,
      targetUserId: user._id,
      targetRole: 'customer',
      createdBy: new Types.ObjectId(adminId),
      isSent: true,
    });

    return notification.save();
  }
}
