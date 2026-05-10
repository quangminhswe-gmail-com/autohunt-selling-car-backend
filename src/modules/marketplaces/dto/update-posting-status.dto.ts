import { IsEnum } from 'class-validator';
import { PostingStatus } from '@/common/constants/enum';

export class UpdatePostingStatusDto {
  @IsEnum(PostingStatus)
  status: PostingStatus;
}
