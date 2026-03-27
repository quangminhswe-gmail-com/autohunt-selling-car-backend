import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ReviewService } from '@/modules/marketplaces/services/review.service';
import { CreateReviewDto } from '@/modules/marketplaces/dto/create-review.dto';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  createReview(@Body() dto: CreateReviewDto, @Req() req) {
    return this.reviewService.createReview(dto, req.user.id);
  }

  @Get('my')
  getMyReviews(@Req() req) {
    return this.reviewService.getMyReviews(req.user.id);
  }
}
