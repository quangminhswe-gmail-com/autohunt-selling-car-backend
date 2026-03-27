import { IsString, IsOptional, IsArray } from 'class-validator';

export class ReplySupportDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
