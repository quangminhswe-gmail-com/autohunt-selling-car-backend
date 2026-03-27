import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  SupportRequest,
  SupportRequestDocument,
} from '@/modules/support/schemas/support-request.schema';

import {
  SupportMessage,
  SupportMessageDocument,
} from '@/modules/support/schemas/support-message.schema';
import { SupportStatus, SupportCategory } from './enums';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportRequest.name)
    private supportRequestModel: Model<SupportRequestDocument>,

    @InjectModel(SupportMessage.name)
    private supportMessageModel: Model<SupportMessageDocument>,
  ) {}

  private async generateTicketCode(): Promise<string> {
    const count = await this.supportRequestModel.countDocuments();

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    return `SUP-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateSupportRequestDto, customerId: string) {
    if (
      dto.category === SupportCategory.REPORT &&
      !dto.postingId &&
      !dto.vehicleId &&
      !dto.transactionId
    ) {
      throw new BadRequestException('Report must link to domain object');
    }
    const ticketCode = await this.generateTicketCode();

    return await this.supportRequestModel.create({
      ...dto,
      ticketCode,
      customerId: new Types.ObjectId(customerId),

      postingId: dto.postingId ? new Types.ObjectId(dto.postingId) : undefined,

      vehicleId: dto.vehicleId ? new Types.ObjectId(dto.vehicleId) : undefined,

      transactionId: dto.transactionId
        ? new Types.ObjectId(dto.transactionId)
        : undefined,
    });
  }

  async reply(requestId: string, dto, senderId: string, senderRole: string) {
    const request = await this.supportRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    await this.supportMessageModel.create({
      requestId,
      senderId,
      senderRole,
      message: dto.message,
      attachments: dto.attachments || [],
    });

    if (senderRole === 'admin') {
      request.status = SupportStatus.IN_PROGRESS;
      await request.save();
    }

    return { message: 'Reply sent successfully' };
  }

  async getMyRequests(customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer id');
    }

    return await this.supportRequestModel.find({
      customerId: new Types.ObjectId(customerId),
    });
  }

  async getAllRequests() {
    return await this.supportRequestModel.find();
  }

  async updateStatus(requestId: string, status: string) {
    return await this.supportRequestModel.findByIdAndUpdate(
      requestId,
      { status },
      { new: true },
    );
  }

  async getMessages(requestId: string) {
    return await this.supportMessageModel.find({
      requestId,
    });
  }
}
