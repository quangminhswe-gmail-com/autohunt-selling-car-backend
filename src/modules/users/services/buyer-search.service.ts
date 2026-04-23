import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import {
  BuyerSearch,
  BuyerSearchDocument,
} from '../schemas/buyer-search.schema';
import {
  BuyerSearchResponseDto,
  CreateBuyerSearchDto,
  UpdateBuyerSearchDto,
} from '../dto/buyer-search.dto';
import {
  Posting,
  PostingDocument,
} from '@/modules/marketplaces/schemas/posting.schema';
import {
  Vehicle,
  VehicleDocument,
} from '@/modules/marketplaces/schemas/vehicle.schema';
import {
  Notification,
  NotificationDocument,
  NotificationTarget,
} from '@/modules/notifications/schemas/notification.schema';

@Injectable()
export class BuyerSearchService {
  constructor(
    @InjectModel(BuyerSearch.name)
    private readonly buyerSearchModel: Model<BuyerSearchDocument>,
    @InjectModel(Posting.name)
    private readonly postingModel: Model<PostingDocument>,
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  private async sendMatchEmail(params: {
    to: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    postingId: string;
  }) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!host || !user || !pass || !from) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const vehicleTitle = `${params.vehicleYear} ${params.vehicleMake} ${params.vehicleModel}`;
    const vehicleLink = `${frontendUrl}/vehicle/${params.postingId}`;

    await transporter.sendMail({
      from,
      to: params.to,
      subject: `AutoHunt: Found a matching car (${vehicleTitle})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Good news! We found a matching car for you.</h2>
          <p><strong>${vehicleTitle}</strong> is now available on AutoHunt.</p>
          <p>
            <a href="${vehicleLink}" target="_blank" rel="noopener noreferrer">
              View car details
            </a>
          </p>
          <p>You are receiving this email because you opted in for match alerts.</p>
        </div>
      `,
    });
  }

  private normalizeText(value?: string) {
    return (value || '').trim().toLowerCase();
  }

  private parseQuery(query: string) {
    const cleaned = this.normalizeText(query);
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);

    const filteredTokens = tokens.filter(
      (token) =>
        ![
          'i',
          'want',
          'to',
          'buy',
          'car',
          'a',
          'an',
          'xe',
          'mua',
          'tim',
          'find',
          'today',
          'for',
          'me',
        ].includes(token),
    );

    const make = filteredTokens[0] || undefined;
    const model = filteredTokens.slice(1, 3).join(' ') || undefined;
    const yearOfManufacture = yearMatch ? Number(yearMatch[0]) : undefined;

    return { make, model, yearOfManufacture };
  }

  private toDto(doc: any): BuyerSearchResponseDto {
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
      _id: String(plain._id),
      buyerId: String(plain.buyerId),
      query: plain.query,
      make: plain.make,
      model: plain.model,
      yearOfManufacture: plain.yearOfManufacture,
      matchedPostingId: plain.matchedPostingId ?? null,
      matchedAt: plain.matchedAt ?? null,
      notifyEmail: plain.notifyEmail ?? null,
      emailOptIn: Boolean(plain.emailOptIn),
      emailSentAt: plain.emailSentAt ?? null,
      active: Boolean(plain.active),
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  async createBuyerSearch(
    buyerId: string,
    dto: CreateBuyerSearchDto,
  ): Promise<BuyerSearchResponseDto> {
    if (!Types.ObjectId.isValid(buyerId)) {
      throw new BadRequestException('Invalid buyer id');
    }

    const parsed = this.parseQuery(dto.query);
    const search = await this.buyerSearchModel.create({
      buyerId: new Types.ObjectId(buyerId),
      query: dto.query.trim(),
      make: dto.make || parsed.make,
      model: dto.model || parsed.model,
      yearOfManufacture: dto.yearOfManufacture || parsed.yearOfManufacture,
      notifyEmail: dto.notifyEmail?.trim().toLowerCase() || null,
      emailOptIn: Boolean(dto.emailOptIn && dto.notifyEmail),
      active: true,
    });

    return this.toDto(search);
  }

  async getBuyerSearches(buyerId: string): Promise<BuyerSearchResponseDto[]> {
    const searches = await this.buyerSearchModel
      .find({ buyerId: new Types.ObjectId(buyerId) })
      .populate({
        path: 'matchedPostingId',
        populate: { path: 'vehicleId' },
      })
      .sort({ createdAt: -1 });

    return searches.map((search) => this.toDto(search));
  }

  async updateBuyerSearch(
    searchId: string,
    dto: UpdateBuyerSearchDto,
  ): Promise<BuyerSearchResponseDto> {
    const search = await this.buyerSearchModel.findById(searchId);

    if (!search) {
      throw new NotFoundException('Buyer search not found');
    }

    Object.assign(search, dto);
    await search.save();
    return this.toDto(search);
  }

  async deleteBuyerSearch(searchId: string): Promise<void> {
    const deleted = await this.buyerSearchModel.findByIdAndDelete(searchId);
    if (!deleted) {
      throw new NotFoundException('Buyer search not found');
    }
  }

  async processNewPostingMatches(postingId: string) {
    const posting = await this.postingModel.findById(postingId);
    if (!posting) {
      return;
    }

    const vehicle = await this.vehicleModel.findById(posting.vehicleId);
    if (!vehicle) {
      return;
    }

    const make = this.normalizeText(vehicle.make);
    const model = this.normalizeText(vehicle.model);
    const year = vehicle.yearOfManufacture;

    const activeSearches = await this.buyerSearchModel.find({
      active: true,
      matchedPostingId: null,
    });

    for (const search of activeSearches) {
      const byMake = !search.make || this.normalizeText(search.make) === make;
      const byModel =
        !search.model || model.includes(this.normalizeText(search.model));
      const byYear =
        !search.yearOfManufacture ||
        Number(search.yearOfManufacture) === Number(year);
      const byQuery = this.normalizeText(search.query).includes(make);

      if (!byMake && !byQuery) {
        continue;
      }
      if (!byModel || !byYear) {
        continue;
      }

      search.matchedPostingId = posting._id;
      search.matchedAt = new Date();
      search.active = false;
      await search.save();

      await this.notificationModel.create({
        title: 'Found a car for your AI request',
        message: `${vehicle.yearOfManufacture} ${vehicle.make} ${vehicle.model} is now available.`,
        targetRole: NotificationTarget.CUSTOMER,
        targetUserId: search.buyerId,
        createdBy: posting.ownerId,
        isSent: true,
      });

      if (search.emailOptIn && search.notifyEmail) {
        try {
          await this.sendMatchEmail({
            to: search.notifyEmail,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            vehicleYear: vehicle.yearOfManufacture,
            postingId: String(posting._id),
          });
          search.emailSentAt = new Date();
          await search.save();
        } catch {
          // Keep matching flow robust even if email provider fails.
        }
      }
    }
  }
}
