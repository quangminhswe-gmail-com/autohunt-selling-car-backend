import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  startConversation(@Body() dto, @Req() req) {
    return this.chatService.startConversation(req.user.id, dto.targetUserId);
  }

  @Get('conversations')
  getMyConversations(@Req() req) {
    return this.chatService.getMyConversations(req.user.id);
  }

  @Get(':conversationId/messages')
  getMessages(@Param('conversationId') id: string) {
    return this.chatService.getMessages(id);
  }

  @Post(':conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: { content: string },
    @Req() req,
  ) {
    return this.chatService.saveMessage({
      conversationId,
      senderId: req.user.id,
      content: dto.content,
    });
  }
}
