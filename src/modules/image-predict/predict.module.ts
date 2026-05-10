import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { PredictService } from './predict.service';
import { PredictController } from './predict.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // tối đa 10MB
      },
    }),
  ],
  controllers: [PredictController],
  providers: [PredictService],
  exports: [PredictService],
})
export class PredictModule {}
