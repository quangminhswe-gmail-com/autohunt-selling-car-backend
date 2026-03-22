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
//Order Module
//==================================================================

//Review Module
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';
//Review Module
//==================================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Posting.name, schema: PostingSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
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
  ],
  controllers: [
    VehicleController,
    VehiclePublicController,
    AdminVehicleController,
    PostingController,
    AdminPostingController,
    OrderController,
    ReviewController,
  ],
})
export class MarketplaceModule {}
