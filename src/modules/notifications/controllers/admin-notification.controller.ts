import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { NotificationService } from '../notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/notifications')
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto, @Req() req) {
    return this.notificationService.create(dto, req.user.id);
  }

  @Get('logs')
  getLogs() {
    return this.notificationService.getLogs();
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }
}
