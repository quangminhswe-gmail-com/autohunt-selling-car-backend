import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class CustomerUsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('create')
  async create() {
    return this.userService.createTestUser();
  }

  //UC-CTM-ACC01-R || CTM-ACC01 ||	View Account Information

  @Get('me')
  getProfile(@Req() req) {
    return this.userService.getProfile(req.user.id);
  }
  //UC-CTM-ACC01-R || CTM-ACC01 ||	View Account Information

  //UC-CTM-ACC01-U ||	CTM-ACC01 ||	Edit Account Information
  @Patch('me')
  updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }
  //UC-CTM-ACC01-U ||	CTM-ACC01 ||	Edit Account Information
}
