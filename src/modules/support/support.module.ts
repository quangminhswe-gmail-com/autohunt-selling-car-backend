import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  SupportRequest,
  SupportRequestSchema,
} from './schemas/support-request.schema';

import {
  SupportMessage,
  SupportMessageSchema,
} from './schemas/support-message.schema';
import { SupportController } from './controllers/support.controller';
import { AdminSupportController } from './controllers/admin-support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SupportRequest.name,
        schema: SupportRequestSchema,
      },
      {
        name: SupportMessage.name,
        schema: SupportMessageSchema,
      },
    ]),
  ],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
})
export class SupportModule {}
