import { IsEnum } from 'class-validator';
import { SupportStatus } from '@/modules/support/enums';

export class UpdateSupportStatusDto {
  @IsEnum(SupportStatus)
  status: SupportStatus;
}
