import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class PredictService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async predict(imageBuffer: Buffer) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const base64Image = imageBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg', // hoặc image/png tùy file upload
        },
      },
      `
      Hãy nhận diện xe trong ảnh này.
      Trả về JSON gồm:
      - brand
      - model (nếu có)
      - type (sedan, suv,...)
      - year of manufacture
      - confidence (ước lượng %)
      `,
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      raw: text,
    };
  }
}
