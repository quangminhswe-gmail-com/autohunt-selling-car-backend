import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './controllers/admin-user.controller';
import { CustomerUsersController } from './controllers/customer-users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { BuyerProfile, BuyerProfileSchema } from './buyer-profile.schema';
import { SellerProfile, SellerProfileSchema } from './seller-profile.schema';
import { BuyerSearch, BuyerSearchSchema } from './schemas/buyer-search.schema';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';
import { Posting, PostingSchema } from '../marketplaces/schemas/posting.schema';
import { Vehicle, VehicleSchema } from '../marketplaces/schemas/vehicle.schema';
import { BuyerSearchController } from './controllers/buyer-search.controller';
import { BuyerSearchService } from './services/buyer-search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BuyerProfile.name, schema: BuyerProfileSchema },
      { name: SellerProfile.name, schema: SellerProfileSchema },
      { name: BuyerSearch.name, schema: BuyerSearchSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Posting.name, schema: PostingSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [
    AdminUsersController,
    CustomerUsersController,
    BuyerSearchController,
  ],
  providers: [UsersService, BuyerSearchService],
  exports: [UsersService, BuyerSearchService],
})
export class UsersModule {}
