import { Controller, Get, Post } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';

@Controller('users-test')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create() {
    return this.usersService.createTestUser();
  }
  @Get('list')
  async findAll() {
    return this.usersService.findAll();
  }
}
