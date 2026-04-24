// ai-assistant.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AiChatController } from './controller/ai-chat.controller';

import { ChatService } from './core/chat.service';
import { SessionService } from './core/session.service';

import { GeminiService } from './llm/gemini.service';

import { SalesAgent } from './agents/sales.agent';

import { VehicleTool } from './tools/vehicle.tool';

import {
  BuyerProfile,
  BuyerProfileSchema,
} from '@/modules/users/buyer-profile.schema';

import {
  SellerProfile,
  SellerProfileSchema,
} from '@/modules/users/seller-profile.schema';

import {
  Vehicle,
  VehicleSchema,
} from '@/modules/marketplaces/schemas/vehicle.schema';

import {
  Posting,
  PostingSchema,
} from '@/modules/marketplaces/schemas/posting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuyerProfile.name, schema: BuyerProfileSchema },
      { name: SellerProfile.name, schema: SellerProfileSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Posting.name, schema: PostingSchema },
    ]),
  ],
  controllers: [AiChatController],
  providers: [
    ChatService,
    SessionService,
    GeminiService,
    SalesAgent,
    VehicleTool,
  ],
})
export class AiAssistantModule {}
