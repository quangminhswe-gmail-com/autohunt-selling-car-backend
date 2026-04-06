import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';

import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,

    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async startConversation(currentUserId: string, targetUserId: string) {
    if (
      !Types.ObjectId.isValid(currentUserId) ||
      !Types.ObjectId.isValid(targetUserId)
    ) {
      throw new BadRequestException('Invalid user id');
    }

    const existing = await this.conversationModel.findOne({
      participants: {
        $all: [
          new Types.ObjectId(currentUserId),
          new Types.ObjectId(targetUserId),
        ],
      },
    });

    if (existing) return existing;

    return await this.conversationModel.create({
      participants: [
        new Types.ObjectId(currentUserId),
        new Types.ObjectId(targetUserId),
      ],
    });
  }

  async getMyConversations(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    return await this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
      })
      .populate('participants', 'firstName lastName email');
  }

  async getMessages(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }

    return await this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
      })
      .populate('senderId', 'firstName lastName email')
      .sort({ createdAt: 1 });
  }

  async saveMessage(data: any) {
    const conversation = await this.conversationModel.findById(
      data.conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      !conversation.participants.some(
        (participant) => participant.toString() === data.senderId,
      )
    ) {
      throw new BadRequestException('You are not part of this conversation');
    }

    const saved = await this.messageModel.create({
      conversationId: new Types.ObjectId(data.conversationId),
      senderId: new Types.ObjectId(data.senderId),
      content: data.content,
    });

    await this.conversationModel.findByIdAndUpdate(data.conversationId, {
      lastMessage: data.content,
      updatedAt: new Date(),
    });

    return await this.messageModel
      .findById(saved._id)
      .populate('senderId', 'firstName lastName email');
  }
}
