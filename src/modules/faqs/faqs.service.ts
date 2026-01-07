import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Faq, FaqDocument } from './faqs.schema';
import { CreateFaqDto, UpdateFaqDto } from './faqs.dto';

@Injectable()
export class FaqService {
    constructor(
        @InjectModel(Faq.name)
        private faqModel: Model<FaqDocument>,
    ) { }

    async create(dto: CreateFaqDto): Promise<Faq> {
        const faq = new this.faqModel(dto);
        return faq.save();
    }

    async update(id: string, dto: UpdateFaqDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid FAQ id');
        }

        const faq = await this.faqModel.findByIdAndUpdate(
            id,
            dto,
            {
                new: true,
                runValidators: true,
            },
        );
        console.log("results find id: ", faq)

        if (!faq) {
            throw new NotFoundException('FAQ not found');
        }

        return faq;
    }

    async findByCategory(category: string): Promise<Faq[]> {
        return this.faqModel
            .find({ category, isActive: true })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findAll(): Promise<Faq[]> {
        return this.faqModel.find({ isActive: true }).exec();
    }
}
