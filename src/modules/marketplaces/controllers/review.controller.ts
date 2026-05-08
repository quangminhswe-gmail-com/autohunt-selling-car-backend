import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/modules/auth/decorators/public.decoration';
import { ReviewService } from '@/modules/marketplaces/services/review.service';
import { CreateReviewDto } from '@/modules/marketplaces/dto/create-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(@Body() dto: CreateReviewDto, @Req() req) {
    return this.reviewService.createReview(dto, req.user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyReviews(@Req() req) {
    return this.reviewService.getMyReviews(req.user.id);
  }

  @Get('seller/:sellerId')
  @Public()
  getReviewsBySeller(@Param('sellerId') sellerId: string) {
    return this.reviewService.getReviewsBySeller(sellerId);
  }

  @Get('vehicle/:vehicleId')
  @Public()
  getReviewsByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.reviewService.getReviewsByVehicle(vehicleId);
  }
}
