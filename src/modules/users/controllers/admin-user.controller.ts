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
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/jwt-roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly userService: UsersService) {}

  // UC-ADM03-R	|| AD-ADM03 ||	Read Customer Profiles
  @Get()
  getCustomers() {
    return this.userService.getCustomers();
  }
  // UC-ADM03-R	|| AD-ADM03 ||	Read Customer Profiles

  // UC-ADM03-U	 || AD-ADM03 ||	Suspend Customer Account
  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.userService.suspendCustomer(id);
  }
  // UC-ADM03-U	 || AD-ADM03 ||	Suspend Customer Account

  @Patch(':id/reactive')
  reactive(@Param('id') id: string) {
    return this.userService.reactiveCustomer(id);
  }

  // UC-ADM03-D ||	AD-ADM03 ||	Delete Customer Information
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.deleteCustomer(id);
  }
  // UC-ADM03-D ||	AD-ADM03 ||	Delete Customer Information
}
