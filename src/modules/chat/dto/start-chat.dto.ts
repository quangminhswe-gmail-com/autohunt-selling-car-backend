import { IsString } from 'class-validator';

export class StartChatDto {
  @IsString()
  targetUserId: string;
}
