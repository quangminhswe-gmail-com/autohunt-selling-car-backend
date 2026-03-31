import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
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

  async getForCustomer(role: string) {
    return await this.notificationModel
      .find({
        $or: [{ targetRole: 'all' }, { targetRole: role }],
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
