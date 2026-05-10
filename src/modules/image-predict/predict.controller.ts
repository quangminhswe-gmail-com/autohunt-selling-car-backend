import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PredictService } from './predict.service';

@Controller('ai')
export class PredictController {
  constructor(private readonly predictService: PredictService) {}

  @Post('predict')
  @UseInterceptors(FileInterceptor('image'))
  async predict(@UploadedFile() file: Express.Multer.File) {
    // 1. check file tồn tại
    if (!file) {
      throw new BadRequestException(
        'Please upload an image using form-data with key "image"',
      );
    }

    // 2. check mime type (tránh upload file rác)
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // 3. check size (optional nhưng nên có)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Image size must be under 5MB');
    }

    try {
      const result = await this.predictService.predict(file.buffer);

      return {
        success: true,
        data: result,
      };
    } catch (error: unknown) {
      const err = error as Error;

      console.error('========== PREDICTION ERROR ==========');
      console.error(err);
      console.error(err.stack);
      console.error('=====================================');

      throw new InternalServerErrorException(
        err.message || 'Prediction failed',
      );
    }
  }
}
