import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateNotificationDto, adminId: string) {
    let targetUserId = null;

    if (dto.targetRole === 'customer' && dto.targetEmail) {
      const user = await this.usersService.findByEmail(dto.targetEmail);
      if (!user) {
        throw new NotFoundException('User with this email not found');
      }
      targetUserId = user._id;
    }

    const notification = new this.notificationModel({
      title: dto.title,
      message: dto.message,
      targetRole: dto.targetRole,
      targetUserId,
      createdBy: new Types.ObjectId(adminId),
      isSent: true,
    });

    const savedNotification = await notification.save();
    return await savedNotification.populate('targetUserId', 'email');
  }

  async getLogs() {
    return await this.notificationModel
      .find()
      .populate('createdBy', 'fullName email')
      .populate('targetUserId', 'email')
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
}
