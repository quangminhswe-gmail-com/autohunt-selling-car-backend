import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  BadRequestException,
  UseGuards,
  Request,
  Delete,
  Patch,
} from '@nestjs/common';

import { PostingService } from '@/modules/marketplaces/services/posting.service';
import { CreatePostingDto } from '@/modules/marketplaces/dto/create-posting.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/modules/auth/decorators/public.decoration';
import { UpdatePostingDto } from '../dto/update-posting.dto';
@Controller('postings')
export class PostingController {
  constructor(private readonly postingService: PostingService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPostingDto: CreatePostingDto, @Req() req) {
    console.log(createPostingDto);
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.postingService.create(createPostingDto, req.user.id);
  }

  @Get()
  @Public()
  findAll() {
    return this.postingService.findAll();
  }

  @Get('my-postings')
  @UseGuards(JwtAuthGuard)
  findMyPostings(@Req() req) {
    return this.postingService.findMyPostings(req.user.id);
  }

  @Get('details/:id')
  @Public()
  async findOne(@Param('id') id: string) {
    await this.postingService.increaseViewCount(id);
    return this.postingService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removePosting(@Param('id') postingId: string, @Request() req) {
    return this.postingService.removePosting(postingId, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePosting(
    @Param('id') postingId: string,
    @Body() dto: UpdatePostingDto,
    @Request() req,
  ) {
    return this.postingService.updatePosting(postingId, dto, req.user.id);
  }
}
