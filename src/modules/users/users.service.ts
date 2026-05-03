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
import { UserSettingsDto } from './dto/user-setting.dto';
import { BuyerProfile, BuyerProfileDocument } from './buyer-profile.schema';

import { SellerProfile, SellerProfileDocument } from './seller-profile.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BuyerProfile.name)
    private buyerModel: Model<BuyerProfileDocument>,

    @InjectModel(SellerProfile.name)
    private sellerModel: Model<SellerProfileDocument>,
  ) {}

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
    const payload = { ...dto } as Record<string, any>;

    if (typeof payload.email === 'string') {
      payload.email = payload.email.trim().toLowerCase();
      const existingUser = await this.userModel
        .findOne({
          email: payload.email,
          _id: { $ne: userId },
        })
        .lean();

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, payload, { new: true })
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

  //save setting as preferences for seller and buyer
  async saveSettings(userId: string, dto: UserSettingsDto) {
    if (!dto.role) {
      throw new BadRequestException('Role is required');
    }

    if (dto.role === 'BUYER') {
      const updated = await this.buyerModel.findOneAndUpdate(
        { userId },
        {
          preferredBrand: dto.preferredBrand,
          preferredType: dto.preferredType,
          preferredColor: dto.preferredColor,
          minYear: dto.minYear,
          maxPrice: dto.maxPrice,
          preferredFeatures: dto.preferredFeatures,
          usagePurpose: dto.usagePurpose,
        },
        {
          upsert: true,
          new: true,
        },
      );

      return {
        role: 'BUYER',
        data: updated,
      };
    }

    if (dto.role === 'SELLER') {
      const updated = await this.sellerModel.findOneAndUpdate(
        { userId },
        {
          sellingPriority: dto.sellingPriority,
          isNegotiable: dto.isNegotiable,
          preferredBuyerType: dto.preferredBuyerType,
        },
        {
          upsert: true,
          new: true,
        },
      );

      return {
        role: 'SELLER',
        data: updated,
      };
    }

    throw new BadRequestException('Invalid role');
  }

  async getSettings(userId: string) {
    const buyer = await this.buyerModel.findOne({ userId }).lean();
    const seller = await this.sellerModel.findOne({ userId }).lean();

    return {
      buyer,
      seller,
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }
}
