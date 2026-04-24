// controller/ai-chat.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from '../core/chat.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-chat')
export class AiChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  chat(@Req() req, @Body() body: { message: string }) {
    return this.chatService.handle(req.user.id, body.message);
  }
}
