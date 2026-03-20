import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './controllers/admin-user.controller';
import { CustomerUsersController } from './controllers/customer-users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AdminUsersController, CustomerUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
