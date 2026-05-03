import { IsString, IsEnum } from 'class-validator';
import { IsMongoId, IsOptional } from 'class-validator';

import { NotificationTarget } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationTarget)
  targetRole: NotificationTarget;

  @IsOptional()
  @IsMongoId()
  targetUserId?: string;
}
