import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../schemas/order.schema';

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  deliveryStatus: DeliveryStatus;
}
