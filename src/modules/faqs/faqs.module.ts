import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from './faqs.schema';
import { FaqService } from './faqs.service';
import { FaqController } from './faqs.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Faq.name, schema: FaqSchema },
        ]),
    ],
    controllers: [FaqController],
    providers: [FaqService],
})
export class FaqModule { }
