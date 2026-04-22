import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

//Vehicle Module
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './controllers/vehicle.controller';
import { VehiclePublicController } from './controllers/vehicle-public.controller';
import { AdminVehicleController } from './controllers/admin-vehicle.controller';
import { AdminVehicleService } from './services/admin-vehicle.service';
//Vehicle Module
//==================================================================
//Posting Module
import { Posting, PostingSchema } from './schemas/posting.schema';
import { PostingService } from './services/posting.service';
import { PostingController } from './controllers/posting.controller';
import { AdminPostingController } from './controllers/admin-posting.controller';
import { AdminPostingService } from './services/admin-posting.service';
//Posting Module
//==================================================================
//Upload Module
import { UploadModule } from '../upload/upload.module';
//Upload Module
//==================================================================
//Order Module
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
//Order Module
//==================================================================

//Review Module
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';
import { AdminReviewsService } from './services/admin-review.service';
import { AdminReviewsController } from './controllers/admin-review.controller';
//Review Module

//Ai search service
import { AiSearchService } from './services/ai-search.service';
// 👇 ADD
import {
  BuyerProfile,
  BuyerProfileSchema,
} from '../users/buyer-profile.schema';
import {
  SellerProfile,
  SellerProfileSchema,
} from '../users/seller-profile.schema';

import { AiConsultService } from './services/ai-consult.service';
import { AiConsultController } from './controllers/ai-consult.controller';
//Ai search service

//User
import { User, UserSchema } from '../users/user.schema';
//==================================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Posting.name, schema: PostingSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: User.name, schema: UserSchema },
      { name: BuyerProfile.name, schema: BuyerProfileSchema },
      { name: SellerProfile.name, schema: SellerProfileSchema },
    ]),
    UploadModule,
  ],
  providers: [
    VehicleService,
    AdminVehicleService,
    PostingService,
    AdminPostingService,
    OrderService,
    ReviewService,
    AdminReviewsService,
    AiSearchService,
    AiConsultService,
  ],
  controllers: [
    VehicleController,
    VehiclePublicController,
    AdminVehicleController,
    PostingController,
    AdminPostingController,
    OrderController,
    AdminOrderController,
    ReviewController,
    AdminReviewsController,
    AiConsultController,
  ],
})
export class MarketplaceModule {}
