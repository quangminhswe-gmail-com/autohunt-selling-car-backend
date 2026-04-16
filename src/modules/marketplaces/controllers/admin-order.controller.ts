import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { OrderService } from '@/modules/marketplaces/services/order.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getAllOrders() {
    return this.orderService.getAllOrdersForAdmin();
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderByIdForAdmin(id);
  }
}
