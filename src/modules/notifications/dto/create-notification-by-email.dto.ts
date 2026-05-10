import { IsString, IsEnum, IsEmail } from 'class-validator';
import { NotificationTarget } from '../schemas/notification.schema';

export class CreateNotificationByEmailDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationTarget)
  targetRole: NotificationTarget;

  @IsEmail()
  email: string;
}
