import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFaqDto {
    @IsString()
    @IsNotEmpty()
    question: string;

    @IsString()
    @IsNotEmpty()
    answer: string;

    @IsString()
    @IsOptional()
    category: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) { }
