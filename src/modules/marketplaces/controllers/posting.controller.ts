import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { PostingService } from '@/modules/marketplaces/services/posting.service';
import { CreatePostingDto } from '@/modules/marketplaces/dto/create-posting.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('postings')
export class PostingController {
  constructor(private readonly postingService: PostingService) {}
  @Post()
  async create(@Body() createPostingDto: CreatePostingDto, @Req() req) {
    console.log(createPostingDto);
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.postingService.create(createPostingDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.postingService.findAll();
  }

  @Get('my-postings')
  findMyPostings(@Req() req) {
    return this.postingService.findMyPostings(req.user.id);
  }

  @Get('details/:id')
  async findOne(@Param('id') id: string) {
    await this.postingService.increaseViewCount(id);
    return this.postingService.findOne(id);
  }
}
