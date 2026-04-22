import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';

import {
  Posting,
  PostingDocument,
} from '@/modules/marketplaces/schemas/posting.schema';

import {
  Vehicle,
  VehicleDocument,
} from '@/modules/marketplaces/schemas/vehicle.schema';

import { CreatePostingDto } from '@/modules/marketplaces/dto/create-posting.dto';
import { PostingStatus } from '@/common/constants/enum';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { UpdatePostingDto } from '../dto/update-posting.dto';
@Injectable()
export class PostingService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(Posting.name)
    private readonly postingModel: Model<PostingDocument>,

    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
  ) {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not set in environment variables',
      );
    }

    this.genAI = new GoogleGenerativeAI(geminiApiKey);
  }

  async generateMarketingContent(vehicle: VehicleDocument): Promise<string> {
    const models = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
    ];
    // const model = this.genAI.getGenerativeModel({
    //   model: ['gemini-2.5-flash', 'gemini-1.5-flash'],
    // });

    const prompt = `
Bạn là chuyên gia viết nội dung quảng cáo xe hơi cho nền tảng AutoHunt.

Dữ liệu xe:
- Hãng xe: ${vehicle.make ?? 'Không rõ'}
- Dòng xe: ${vehicle.model ?? 'Không rõ'}
- Năm sản xuất: ${vehicle.yearOfManufacture ?? 'Không rõ'}
- Tình trạng: ${vehicle.condition ?? 'Không rõ'}
- Số km đã đi: ${vehicle.mileage ?? 0} km
- Màu sắc: ${vehicle.color ?? 'Không rõ'}
- Trang bị: ${Array.isArray(vehicle.features) ? vehicle.features.join(', ') : 'Không có'}

Yêu cầu bắt buộc:
1. Viết bằng tiếng Việt chuyên nghiệp, tự nhiên.
2. Không bịa thêm thông tin ngoài dữ liệu cung cấp.
3. Nội dung tối đa 180 từ.
4. Format đúng như sau:
[Mở bài 2 câu tạo cảm xúc]
Ưu điểm nổi bật:
- bullet 1
- bullet 2
- bullet 3
[CTA rõ ràng mời liên hệ]
5. Headline phải hấp dẫn như bài đăng marketplace thật.
6. Chỉ trả về nội dung cuối cùng, không giải thích thêm.
7. Không dùng markdown.
8. Không thêm tiêu đề ngoài format yêu cầu.
9. Không giải thích
10. Đúng format marketplace
`;
    for (const modelName of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
          });

          const result = await model.generateContent(prompt);

          const text = result?.response?.text();

          if (!text) {
            throw new Error('Empty AI response');
          }

          return text;
        } catch (error: any) {
          // const result = await model.generateContent(prompt);
          // return result.response.text();
          console.error(
            `[AI ERROR] model=${modelName} attempt=${attempt}`,
            error?.message,
          );

          // nếu là lần retry cuối của model này → chuyển model khác
          if (attempt === 2) break;
        }
      }
    }
    throw new InternalServerErrorException('AI service unavailable');
  }

  // async create(createPostingDto: CreatePostingDto, userId: string) {
  //   const vehicle = await this.vehicleModel.findById(
  //     createPostingDto.vehicleId,
  //   );

  //   if (!vehicle) {
  //     throw new BadRequestException('Vehicle not found');
  //   }

  //   const existingPosting = await this.postingModel.findOne({
  //     vehicleId: createPostingDto.vehicleId,
  //   });

  //   if (existingPosting) {
  //     throw new BadRequestException('This vehicle already has a posting');
  //   }

  //   const slug = slugify(createPostingDto.title, {
  //     lower: true,
  //     strict: true,
  //   });

  //   const existingSlug = await this.postingModel.findOne({ slug });

  //   const finalSlug = `${slug}-${Date.now()}`;

  //   const aiDescription = await this.generateMarketingContent(vehicle);

  //   const posting = await this.postingModel.create({
  //     ...createPostingDto,
  //     description: createPostingDto.description?.trim()
  //       ? `${createPostingDto.description}\n\n${aiDescription}`
  //       : aiDescription,
  //     ownerId: userId,
  //     slug: finalSlug,
  //     status: PostingStatus.ACTIVE,
  //   });

  //   return posting;
  // }

  async create(createPostingDto: CreatePostingDto, userId: string) {
    let vehicle: any = null;

    try {
      vehicle = await this.vehicleModel.findById(createPostingDto.vehicleId);

      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      const existingPosting = await this.postingModel.findOne({
        vehicleId: createPostingDto.vehicleId,
      });

      if (existingPosting) {
        throw new BadRequestException('This vehicle already has a posting');
      }

      const slug = slugify(createPostingDto.title, {
        lower: true,
        strict: true,
      });

      const finalSlug = `${slug}-${Date.now()}`;

      let aiDescription = '';
      try {
        aiDescription = (await this.generateMarketingContent(vehicle)).trim();
      } catch (aiError) {
        if (aiError instanceof Error) {
          console.error('[AI DESCRIPTION ERROR]', aiError.message);
        } else {
          console.error('[AI DESCRIPTION ERROR]', aiError);
        }
      }

      const posting = await this.postingModel.create({
        ...createPostingDto,
        description: aiDescription,
        ownerId: userId,
        slug: finalSlug,
        status: PostingStatus.ACTIVE,
      });

      return posting;
    } catch (error) {
      if (error instanceof Error) {
        console.error('[CREATE POSTING ERROR]', error.message);
      } else {
        console.error('[CREATE POSTING ERROR]', error);
      }

      // 🔥 rollback: xóa vehicle nếu có
      if (vehicle?._id) {
        await this.vehicleModel.findByIdAndDelete(vehicle._id);
        console.log('[ROLLBACK] Vehicle deleted:', vehicle._id);
      }

      throw error;
    }
  }

  // async findAll() {
  //   return this.postingModel
  //     .find()
  //     .populate('vehicleId')
  //     .populate('ownerId')
  //     .sort({ createdAt: -1 });
  // }
  async findAll() {
    const postings = await this.postingModel
      .find()
      .populate('vehicleId')
      .populate('ownerId')
      .sort({ createdAt: -1 });

    return postings.map((posting) => {
      const plainPosting = posting.toObject();
      return {
        ...plainPosting,
        vehicle: plainPosting.vehicleId,
        vehicleId: plainPosting.vehicleId?._id,
      };
    });
  }

  // async findOne(id: string) {
  //   return this.postingModel
  //     .findById(id)
  //     .populate('vehicleId')
  //     .populate('ownerId');
  // }

  async findOne(id: string) {
    const posting = await this.postingModel
      .findById(id)
      .populate('vehicleId')
      .populate('ownerId');

    if (!posting) return null;

    const plainPosting = posting.toObject();

    return {
      ...plainPosting,
      vehicle: plainPosting.vehicleId,
      vehicleId: plainPosting.vehicleId?._id,
    };
  }

  async increaseViewCount(id: string) {
    return this.postingModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );
  }

  async findMyPostings(userId: string) {
    const postings = await this.postingModel
      .find({ ownerId: userId })
      .populate('vehicleId')
      .populate('ownerId')
      .sort({ createdAt: -1 });

    // Transform vehicleId to vehicle for frontend compatibility
    return postings.map((posting) => {
      const plainPosting = posting.toObject();
      return {
        ...plainPosting,
        vehicle: plainPosting.vehicleId,
        vehicleId: plainPosting.vehicleId?._id, // Keep original vehicleId as reference
      };
    });
  }

  async removePosting(postingId: string, userId: string) {
    const session = await this.postingModel.db.startSession();
    session.startTransaction();

    try {
      const posting = await this.postingModel
        .findById(postingId)
        .session(session);

      if (!posting) {
        throw new BadRequestException('Posting not found');
      }

      if (posting.ownerId.toString() !== userId) {
        throw new BadRequestException('No permission');
      }

      await this.vehicleModel
        .findByIdAndDelete(posting.vehicleId)
        .session(session);
      await this.postingModel.findByIdAndDelete(postingId).session(session);

      await session.commitTransaction();

      return {
        message: 'Deleted successfully',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updatePosting(
    postingId: string,
    dto: UpdatePostingDto,
    userId: string,
  ) {
    const posting = await this.postingModel.findById(postingId);

    if (!posting) {
      throw new BadRequestException('Posting not found');
    }

    if (posting.ownerId.toString() !== userId) {
      throw new BadRequestException('No permission');
    }

    if (dto.title) {
      const slug = slugify(dto.title, {
        lower: true,
        strict: true,
      });

      posting.slug = `${slug}-${Date.now()}`;
    }

    Object.keys(dto).forEach(
      (key) => dto[key] === undefined && delete dto[key],
    );

    Object.assign(posting, dto);

    return posting.save();
  }
}
