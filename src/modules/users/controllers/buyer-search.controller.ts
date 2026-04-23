import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BuyerSearchService } from '../services/buyer-search.service';
import {
  CreateBuyerSearchDto,
  UpdateBuyerSearchDto,
  BuyerSearchResponseDto,
} from '../dto/buyer-search.dto';

@UseGuards(JwtAuthGuard)
@Controller('buyer-searches')
export class BuyerSearchController {
  constructor(private readonly buyerSearchService: BuyerSearchService) {}

  @Post()
  async createBuyerSearch(
    @Req() req: any,
    @Body() dto: CreateBuyerSearchDto,
  ): Promise<BuyerSearchResponseDto> {
    return this.buyerSearchService.createBuyerSearch(req.user.id, dto);
  }

  @Get('my-searches')
  async getBuyerSearches(@Req() req: any): Promise<BuyerSearchResponseDto[]> {
    return this.buyerSearchService.getBuyerSearches(req.user.id);
  }

  @Patch(':searchId')
  async updateBuyerSearch(
    @Param('searchId') searchId: string,
    @Body() dto: UpdateBuyerSearchDto,
  ): Promise<BuyerSearchResponseDto> {
    return this.buyerSearchService.updateBuyerSearch(searchId, dto);
  }

  @Delete(':searchId')
  async deleteBuyerSearch(@Param('searchId') searchId: string): Promise<void> {
    return this.buyerSearchService.deleteBuyerSearch(searchId);
  }
}
