import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';

import { OrderService } from '@/modules/marketplaces/services/order.service';
import { CreateOrderDto } from '@/modules/marketplaces/dto/create-order.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OrderStatus } from '../schemas/order.schema';
import { UpdateDeliveryStatusDto } from '../dto/update-delivery-status.dto';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Req() req) {
    const customerId = req.user.id || req.user.sub;

    return this.orderService.createOrder(dto, customerId);
  }

  @Get('my-orders')
  getMyOrders(@Req() req) {
    const customerId = req.user.id || req.user.sub;

    return this.orderService.getMyOrders(customerId);
  }

  @Get('owner-orders')
  getOwnerOrders(@Req() req) {
    const ownerId = req.user.id || req.user.sub;

    return this.orderService.getOwnerOrders(ownerId);
  }

  @Get(':id/track-delivery')
  trackDelivery(@Param('id') orderId: string, @Req() req) {
    return this.orderService.trackDelivery(orderId, req.user.id);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body('orderStatus') orderStatus: OrderStatus,
    @Req() req,
  ) {
    return this.orderService.updateOrderStatus(
      orderId,
      orderStatus,
      req.user.id,
    );
  }

  @Patch(':id/delivery-status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @Req() req,
  ) {
    return this.orderService.updateDeliveryStatus(id, dto, req.user.id);
  }

  @Patch(':id/payment-status')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
    @Req() req,
  ) {
    return this.orderService.updatePaymentStatus(
      id,
      paymentStatus,
      req.user.id,
    );
  }
}
