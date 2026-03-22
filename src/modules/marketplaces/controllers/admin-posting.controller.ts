import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { AdminPostingService } from '@/modules/marketplaces/services/admin-posting.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PostingStatus } from '@/common/constants/enum';
import { UpdatePostingStatusDto } from '@/modules/marketplaces/dto/update-posting-status.dto';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/postings')
export class AdminPostingController {
  constructor(private readonly adminPostingService: AdminPostingService) {}

  @Get()
  getAllPostings() {
    return this.adminPostingService.getAllPostings();
  }

  @Delete(':id')
  deletePosting(@Param('id') id: string) {
    return this.adminPostingService.deletePosting(id);
  }

  @Patch(':id/status')
  updatePostingStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostingStatusDto,
  ) {
    return this.adminPostingService.updatePostingStatus(id, dto.status);
  }
}
