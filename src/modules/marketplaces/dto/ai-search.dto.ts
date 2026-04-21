// dto/ai-search.dto.ts
import { IsString } from 'class-validator';

export class AiSearchDto {
  @IsString()
  query: string;
}