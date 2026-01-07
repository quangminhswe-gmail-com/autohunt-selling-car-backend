import { Body, Controller, Get, Post, Query, Param, Patch } from '@nestjs/common';
import { FaqService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './faqs.dto';

@Controller('faqs')
export class FaqController {
    constructor(private readonly faqService: FaqService) { }

    @Post('create-faqs')
    create(@Body() dto: CreateFaqDto) {
        return this.faqService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateFaqDto,
    ) {
        return this.faqService.update(id, dto);
    }

}
