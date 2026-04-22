import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './controllers/admin-user.controller';
import { CustomerUsersController } from './controllers/customer-users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { BuyerProfile, BuyerProfileSchema } from './buyer-profile.schema';
import { SellerProfile, SellerProfileSchema } from './seller-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BuyerProfile.name, schema: BuyerProfileSchema },
      { name: SellerProfile.name, schema: SellerProfileSchema },
    ]),
  ],
  controllers: [AdminUsersController, CustomerUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
