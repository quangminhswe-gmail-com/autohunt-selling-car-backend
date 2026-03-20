import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { OrderService } from '@/modules/marketplaces/services/order.service';
import { CreateOrderDto } from '@/modules/marketplaces/dto/create-order.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

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
    const customerId = req.user.userId || req.user.sub;

    return this.orderService.getMyOrders(customerId);
  }

  @Get('owner-orders')
  getOwnerOrders(@Req() req) {
    const ownerId = req.user.userId || req.user.sub;

    return this.orderService.getOwnerOrders(ownerId);
  }
}
