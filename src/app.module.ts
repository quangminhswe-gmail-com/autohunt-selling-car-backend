import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import 'dotenv'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['./env/development.env', './env/production.env'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
      }),
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
