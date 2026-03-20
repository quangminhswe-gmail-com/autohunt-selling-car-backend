import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

//Vehicle Module
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './controllers/vehicle.controller';
//Vehicle Module
//==================================================================
//Posting Module
import { Posting, PostingSchema } from './schemas/posting.schema';
import { PostingService } from './services/posting.service';
import { PostingController } from './controllers/posting.controller';
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
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Posting.name, schema: PostingSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    UploadModule,
  ],
  providers: [VehicleService, PostingService, OrderService],
  controllers: [VehicleController, PostingController, OrderController],
})
export class MarketplaceModule {}
