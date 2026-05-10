import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat.service';

@WebSocketGateway({
  cors: true,
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  joinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    console.log('joined room:', room);

    client.join(room);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data, @ConnectedSocket() client: Socket) {
    console.log('incoming message:', data);

    const saved = await this.chatService.saveMessage(data);

    this.server.to(data.conversationId).emit('receiveMessage', saved);

    return saved;
  }
}
