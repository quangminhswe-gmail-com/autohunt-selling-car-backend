import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from '../support.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  getAll() {
    return this.supportService.getAllRequests();
  }

  @Get(':id/messages')
  getMessages(@Param('id') id) {
    return this.supportService.getMessages(id);
  }

  @Post(':id/reply')
  reply(@Param('id') id, @Body() dto, @Req() req) {
    return this.supportService.reply(id, dto, req.user.id, 'admin');
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id, @Body() dto) {
    return this.supportService.updateStatus(id, dto.status);
  }
}
