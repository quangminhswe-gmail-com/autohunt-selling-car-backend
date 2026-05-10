import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from '@modules/users/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserRole, SellerStatus } from '@/common/constants/enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // ================= SIGN UP =================
  async signUp(dto: SignUpDto) {
    console.log('SignUp DTO:', dto); // Debugging line
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      role: UserRole.CUSTOMER,
      sellerStatus: SellerStatus.NONE,
      isEmailVerified: false,
      isActive: true,
      rating: 0,
      totalPostings: 0,
    });

    return {
      message: 'Sign up successfully',
      userId: user._id,
    };
  }

  // ================= SIGN IN =================
  async signIn(dto: SignInDto) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (user?.provider === 'google') {
      throw new UnauthorizedException('Please login with Google');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sellerStatus: user.sellerStatus,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async googleLogin(userData: any) {
    let user = await this.userModel.findOne({
      email: userData.email.toLowerCase(),
    });

    if (!user) {
      user = await this.userModel.create({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatarUrl: userData.avatarUrl,
        provider: 'google',
        providerId: userData.providerId,
        role: UserRole.CUSTOMER,
        sellerStatus: SellerStatus.NONE,
        isEmailVerified: true,
        isActive: true,
        rating: 0,
        totalPostings: 0,
      });
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user,
    };
  }
}
