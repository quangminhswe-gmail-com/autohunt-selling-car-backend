import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Load environment variables (local: .env | prod: system env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URL');
        if (!uri) {
          throw new Error('❌ MONGO_URL is not defined');
        }
        return { uri };
      },
    }),
  ],
})
export class AppModule {}
