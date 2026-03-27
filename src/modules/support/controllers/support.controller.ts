import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from '../support.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@Body() dto, @Req() req) {
    return this.supportService.create(dto, req.user.id);
  }

  @Post(':id/reply')
  reply(@Param('id') id, @Body() dto, @Req() req) {
    return this.supportService.reply(id, dto, req.user.id, 'customer');
  }

  @Get('my')
  getMyRequests(@Req() req) {
    return this.supportService.getMyRequests(req.user.id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id) {
    return this.supportService.getMessages(id);
  }
}
