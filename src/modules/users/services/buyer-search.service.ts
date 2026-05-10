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
import { User, UserDocument } from '../user.schema';
import { PostingStatus } from '@/common/constants/enum';

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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

  private async sendBuyerInterestEmail(params: {
    to: string;
    sellerName: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string;
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
      subject: `AutoHunt: A buyer is interested in your ${vehicleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Hello ${params.sellerName},</h2>
          <p>A buyer has just submitted a request that matches your listing <strong>${vehicleTitle}</strong>.</p>
          <p><strong>Buyer info</strong></p>
          <ul>
            <li>Name: ${params.buyerName}</li>
            <li>Email: ${params.buyerEmail}</li>
            <li>Phone: ${params.buyerPhone || 'Not provided'}</li>
          </ul>
          <p>
            <a href="${vehicleLink}" target="_blank" rel="noopener noreferrer">
              View your listing
            </a>
          </p>
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

  private matchesSearchCriteria(params: {
    searchMake?: string;
    searchModel?: string;
    searchYear?: number;
    searchQuery: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
  }) {
    const byMake =
      !params.searchMake ||
      this.normalizeText(params.searchMake) ===
        this.normalizeText(params.vehicleMake);
    const byModel =
      !params.searchModel ||
      this.normalizeText(params.vehicleModel).includes(
        this.normalizeText(params.searchModel),
      );
    const byYear =
      !params.searchYear ||
      Number(params.searchYear) === Number(params.vehicleYear);
    const byQuery = this
      .normalizeText(params.searchQuery)
      .includes(this.normalizeText(params.vehicleMake));

    return (byMake || byQuery) && byModel && byYear;
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

    await this.processNewBuyerSearchMatches(String(search._id));

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
      const isMatched = this.matchesSearchCriteria({
        searchMake: search.make,
        searchModel: search.model,
        searchYear: search.yearOfManufacture,
        searchQuery: search.query,
        vehicleMake: make,
        vehicleModel: model,
        vehicleYear: year,
      });

      if (!isMatched) {
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

  async processNewBuyerSearchMatches(searchId: string) {
    const search = await this.buyerSearchModel.findById(searchId);
    if (!search || !search.active) {
      return;
    }

    const buyer = await this.userModel.findById(search.buyerId).lean();
    if (!buyer) {
      return;
    }

    const postings = await this.postingModel
      .find({ status: PostingStatus.ACTIVE })
      .populate('vehicleId')
      .populate('ownerId');

    let firstMatchedPostingId: Types.ObjectId | null = null;
    const notifiedSellerIds = new Set<string>();

    for (const posting of postings) {
      const vehicle = posting.vehicleId as any;
      const owner = posting.ownerId as any;

      if (!vehicle || !owner) {
        continue;
      }

      const ownerId = String(owner._id);
      if (ownerId === String(search.buyerId)) {
        continue;
      }

      const isMatched = this.matchesSearchCriteria({
        searchMake: search.make,
        searchModel: search.model,
        searchYear: search.yearOfManufacture,
        searchQuery: search.query,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleYear: vehicle.yearOfManufacture,
      });

      if (!isMatched) {
        continue;
      }

      if (!firstMatchedPostingId) {
        firstMatchedPostingId = posting._id as Types.ObjectId;
      }

      if (notifiedSellerIds.has(ownerId)) {
        continue;
      }
      notifiedSellerIds.add(ownerId);

      const buyerName = `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim();
      const buyerPhone = buyer.phoneNumber?.trim() || '';

      const messageParts = [
        `${buyerName || 'A buyer'} is interested in your ${vehicle.yearOfManufacture} ${vehicle.make} ${vehicle.model}.`,
        `Email: ${buyer.email}`,
      ];
      if (buyerPhone) {
        messageParts.push(`Phone: ${buyerPhone}`);
      }

      await this.notificationModel.create({
        title: 'A buyer matched your listing',
        message: messageParts.join(' '),
        targetRole: NotificationTarget.CUSTOMER,
        targetUserId: owner._id,
        createdBy: search.buyerId,
        isSent: true,
      });

      try {
        await this.sendBuyerInterestEmail({
          to: owner.email,
          sellerName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Seller',
          buyerName: buyerName || 'AutoHunt buyer',
          buyerEmail: buyer.email,
          buyerPhone,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          vehicleYear: vehicle.yearOfManufacture,
          postingId: String(posting._id),
        });
      } catch {
        // Do not fail matching if email sending fails.
      }
    }

    if (firstMatchedPostingId) {
      search.matchedPostingId = firstMatchedPostingId;
      search.matchedAt = new Date();
      search.active = false;
      await search.save();
    }
  }
}
