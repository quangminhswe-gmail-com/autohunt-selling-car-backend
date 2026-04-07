import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '@/modules/users/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createTestUser() {
    const randomStr = Math.random().toString(36).substring(7);
    const newUser = new this.userModel({
      name: ` Test ${randomStr}`,
      email: `test-${randomStr}@autohunt.com`,
    });
    return newUser.save();
  }

  async findAll() {
    return this.userModel.find().exec();
  }

  // UC-ADM03-R	|| AD-ADM03 ||	Read Customer Profiles
  async getCustomers() {
    return this.userModel.find({
      role: 'customer',
    });
  }
  // UC-ADM03-R	|| AD-ADM03 ||	Read Customer Profiles

  // UC-ADM03-U	 || AD-ADM03 ||	Suspend Customer Account
  async suspendCustomer(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    user.isActive = false;

    return user.save();
  }
  // UC-ADM03-U	 || AD-ADM03 ||	Suspend Customer Account

  async reactiveCustomer(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    user.isActive = true;

    return user.save();
  }

  // UC-ADM03-D ||	AD-ADM03 ||	Delete Customer Information
  async deleteCustomer(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    user.isDelete = true;

    return user.save();
  }
  // UC-ADM03-D ||	AD-ADM03 ||	Delete Customer Information

  //UC-CTM-ACC01-R || CTM-ACC01 ||	View Account Information
  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
  //UC-CTM-ACC01-R || CTM-ACC01 ||	View Account Information

  //UC-CTM-ACC01-U ||	CTM-ACC01 ||	Edit Account Information
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Password change is not available for this account',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    return user.save();
  }
  //UC-CTM-ACC01-U ||	CTM-ACC01 ||	Edit Account Information
}
