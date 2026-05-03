import { IsString, IsEnum, IsEmail } from 'class-validator';
import { IsOptional } from 'class-validator';

import { NotificationTarget } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationTarget)
  targetRole: NotificationTarget;

  @IsOptional()
  @IsEmail()
  targetEmail?: string;
}
