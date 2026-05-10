import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

import { User, UserSchema } from '@/modules/users/user.schema';

import { NotificationService } from './notification.service';
import { NotificationController } from './controllers/notification.controller';
import { AdminNotificationController } from './controllers/admin-notification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
