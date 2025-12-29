import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

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
}