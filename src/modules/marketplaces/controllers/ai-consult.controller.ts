import { Controller, Post, Body, Req } from '@nestjs/common';
import { AiConsultService } from '../services/ai-consult.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiConsultController {
  constructor(private readonly aiConsultService: AiConsultService) {}

  @Post('consult')
  consult(@Req() req, @Body('message') message: string) {
    return this.aiConsultService.consult(req.user.id, message);
  }
}
