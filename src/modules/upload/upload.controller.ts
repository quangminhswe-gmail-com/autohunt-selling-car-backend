import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('images'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const result: any = await this.cloudinaryService.uploadFile(file);

    return {
      url: result.secure_url,
    };
  }
}
