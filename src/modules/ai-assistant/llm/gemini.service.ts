import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @Injectable()
// export class GeminiService {
//   private model;

//   constructor(private configService: ConfigService) {
//     const apiKey = this.configService.get<string>('GEMINI_API_KEY');

//     if (!apiKey) {
//       throw new Error('❌ Missing GEMINI_API_KEY');
//     }

//     const genAI = new GoogleGenerativeAI(apiKey);

//     this.model = genAI.getGenerativeModel({
//       model: 'gemini-2.5-flash',
//       generationConfig: {
//         temperature: 0.3, // ổn định hơn
//         maxOutputTokens: 300, // giới hạn cost
//       },
//     });
//   }

//   async generate(prompt: string): Promise<string> {
//     try {
//       const res = await this.model.generateContent(prompt);
//       return res.response.text();
//     } catch (err) {
//       console.error('[Gemini Error]', err);

//       // fallback tránh crash system
//       return JSON.stringify({
//         budget: null,
//         carType: null,
//         passengers: null,
//         purpose: null,
//         missingFields: ['budget', 'carType', 'passengers', 'purpose'],
//       });
//     }
//   }
@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getModel(model: string) {
    return this.genAI.getGenerativeModel({ model });
  }

  async generate({
    prompt,
    model = 'gemini-2.5-flash',
    maxTokens = 300,
  }: {
    prompt: string;
    model?: string;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const modelInstance = this.getModel(model);

      const res = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: maxTokens,
        },
      });

      return res.response.text();
    } catch (err) {
      console.error('[Gemini Error]', err);
      throw err;
    }
  }
}
