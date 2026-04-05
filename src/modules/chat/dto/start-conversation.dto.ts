import { IsString } from 'class-validator';

export class StartConversationDto {
  @IsString()
  targetUserId!: string;
}
