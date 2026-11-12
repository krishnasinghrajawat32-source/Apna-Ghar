import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Mess, MessDocument } from './schemas/mess.schema';
import { MessSubscription, MessSubscriptionDocument } from './schemas/mess-subscription.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MessPartnerProfile, MessPartnerProfileDocument } from '../users/schemas/mess-partner-profile.schema';
import { CreateMessSubscriptionDto } from './dto/create-mess-subscription.dto';
import { CreateMessDto } from './dto/create-mess.dto';
import { UpdateMessDto } from './dto/update-mess.dto';
import { UpdateMealPlansDto } from './dto/update-meal-plans.dto';
import { SubscriptionDecisionDto } from './dto/subscription-decision.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { DailyMenu, UserRole, ApprovalStatus, SubscriptionStatus, RoleApprovalStatus } from '@apna-ghar/shared-types';
import { ERROR_CODES } from '@apna-ghar/shared-constants';

@Injectable()
export class MessService implements OnModuleInit {
  private readonly logger = new Logger(MessService.name);

  constructor(
    @InjectModel(Mess.name) private readonly messModel: Model<MessDocument>,
    @InjectModel(MessSubscription.name)
    private readonly subscriptionModel: Model<MessSubscriptionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(MessPartnerProfile.name)
    private readonly partnerProfileModel: Model<MessPartnerProfileDocument>,
  ) {}

  async onModuleInit() {
    const isConnected = !this.messModel.db || this.messModel.db.readyState === 1;
    if (isConnected) {
      await this.seedInitialMesses();
    } else {
      this.messModel.db.once('connected', () => {
        this.seedInitialMesses().catch((err) => {
          this.logger.warn(`Mess seeding skipped or deferred: ${err.message}`);
        });
      });
    }
  }

  private generateSubscriptionNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = randomBytes(2).toString('hex').toUpperCase();
    return `MS-${dateStr}-${randomSuffix}`;
  }

  private async seedInitialMesses() {
    try {
      const count = await this.messModel.countDocuments();
      if (count > 0) return;

      this.logger.log('Seeding initial verified student mess partners and outlets...');

    // Find or create default mess partner user
    let partner = await this.userModel.findOne({ email: 'mess@apnaghar.in' });
    if (!partner) {
      partner = await this.userModel.create({
        name: 'Annapurna Food Services',
        email: 'mess@apnaghar.in',
        phone: '9876543299',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$seedhash$seedhash',
        role: UserRole.MESS_PARTNER,
      });
    }

    const initialMesses = [
      {
        partnerId: partner._id,
        name: 'Annapurna Pure Veg Student Mess',
        slug: 'annapurna-pure-veg-mess-kota',
        description:
          'Hygienic, homestyle pure vegetarian student dining. Unlimited rotis, high-protein dals, green seasonal vegetables, and pure filtered water.',
        dietaryType: 'PURE_VEG',
        fssaiNumber: '10022011000123',
        address: {
          street: 'Plot 14, Opposite Allen Landmark, CP Road',
          city: 'Kota',
          state: 'Rajasthan',
          pincode: '324005',
          landmark: 'Allen Landmark Campus Gate 2',
        },
        rating: 4.8,
        hygieneCertified: true,
        operatingHours: {
          breakfast: '07:30 - 09:30',
          lunch: '12:30 - 14:30',
          dinner: '19:30 - 21:30',
        },
        plans: [
          {
            id: 'plan-annapurna-full-3m',
            name: 'Full Day Student Plan (Breakfast + Lunch + Dinner)',
            mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
            daysPerWeek: 7,
            monthlyPrice: 3800,
            description: '3 meals daily with unlimited rotis, dal, and weekend sweet specials.',
          },
          {
            id: 'plan-annapurna-2m',
            name: 'Standard Two Meals Plan (Lunch + Dinner)',
            mealTypes: ['LUNCH', 'DINNER'],
            daysPerWeek: 7,
            monthlyPrice: 3100,
            description: 'Lunch and dinner daily with seasonal sabzi, dal tadka, and salad.',
          },
          {
            id: 'plan-annapurna-lunch',
            name: 'Campus Lunch Only Pass',
            mealTypes: ['LUNCH'],
            daysPerWeek: 6,
            monthlyPrice: 1800,
            description: 'Packed hot lunch tiffin delivered to campus coaching classes.',
          },
        ],
        weeklyMenu: [
          {
            day: 'MONDAY',
            breakfast: 'Indori Poha + Sprouts Salad + Hot Masala Chai',
            lunch: 'Shahi Paneer + Dal Tadka + Unlimited Phulkas + Jeera Rice + Cucumber Salad',
            snacks: 'Crispy Veg Samosa + Chai',
            dinner: 'Aloo Gobi + Yellow Moong Dal + Tawa Roti + Steamed Rice + Gulab Jamun',
            specialDietNote: 'Jain preparation available upon prior request',
          },
          {
            day: 'TUESDAY',
            breakfast: 'Methi Thepla + Curd + Lemon Pickle + Chai',
            lunch: 'Rajma Masala + Mixed Veg + Roti + Basmati Rice + Boondi Raita',
            dinner: 'Palak Paneer + Chana Dal + Phulka + Veg Pulao + Rasgulla',
          },
          {
            day: 'WEDNESDAY',
            breakfast: 'South Indian Idli Sambar + Coconut Chutney + Filter Coffee',
            lunch: 'Chole Bhature / Roti + Dal Fry + Jeera Rice + Green Chutney',
            dinner: 'Malai Kofta + Arhar Dal + Hot Phulkas + Rice + Kheer',
          },
          {
            day: 'THURSDAY',
            breakfast: 'Vegetable Upma + Peanut Chutney + Chai',
            lunch: 'Kadhi Pakora + Aloo Jeera + Roti + Steamed Rice + Roasted Papad',
            dinner: 'Matar Paneer + Dal Makhani + Butter Roti + Jeera Rice + Ice Cream',
          },
          {
            day: 'FRIDAY',
            breakfast: 'Aloo Paratha + Amul Butter + Mint Curd + Tea',
            lunch: 'Paneer Bhurji + Dal Palak + Tawa Roti + Fried Rice + Salad',
            dinner: 'Baingan Bharta / Bhindi Masala + Panchmel Dal + Phulka + Rice + Halwa',
          },
          {
            day: 'SATURDAY',
            breakfast: 'Puri Sabzi + Sooji Halwa + Masala Chai',
            lunch: 'Dum Aloo Kashmiri + Dal Tadka + Roti + Pulao + Curd',
            dinner: 'Kadhai Paneer + Dal Fry + Roti + Rice + Jalebi',
          },
          {
            day: 'SUNDAY',
            breakfast: 'Masala Dosa + Sambhar + Coconut Chutney',
            lunch: 'Special Sunday Thali: Paneer Lababdar + Dal Bukhara + Naan / Roti + Veg Biryani',
            dinner: 'Pav Bhaji + Tawa Pulao + Mixed Salad + Sweet Lassi',
            specialDietNote: 'Special Sunday Feast included for all monthly subscribers',
          },
        ],
        status: 'ACTIVE',
      },
      {
        partnerId: partner._id,
        name: 'Swad Rasoi Satvik & Jain Mess',
        slug: 'swad-rasoi-satvik-mess-kota',
        description:
          '100% Satvik cooking with dedicated zero-onion, zero-garlic Jain kitchen options. High hygiene, mineral water RO plant on-site.',
        dietaryType: 'JAIN_AVAILABLE',
        fssaiNumber: '10022011000456',
        address: {
          street: 'Sector A, Near Resonance Main Building',
          city: 'Kota',
          state: 'Rajasthan',
          pincode: '324005',
          landmark: 'Opposite Resonance Study Circle',
        },
        rating: 4.7,
        hygieneCertified: true,
        operatingHours: {
          breakfast: '07:00 - 09:30',
          lunch: '12:00 - 14:30',
          dinner: '19:00 - 21:00',
        },
        plans: [
          {
            id: 'plan-swad-full-monthly',
            name: 'Satvik Full Month (3 Meals Daily)',
            mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
            daysPerWeek: 7,
            monthlyPrice: 3600,
            description: 'Wholesome nutritious homestyle food, zero onion/garlic options marked separately.',
          },
          {
            id: 'plan-swad-2m',
            name: 'Satvik Two Meals (Lunch + Dinner)',
            mealTypes: ['LUNCH', 'DINNER'],
            daysPerWeek: 7,
            monthlyPrice: 2900,
            description: 'Lunch & Dinner daily with fresh cow milk ghee and hand-rolled chapatis.',
          },
        ],
        weeklyMenu: [
          {
            day: 'MONDAY',
            breakfast: 'Poha / Dalia + Milk / Tea',
            lunch: 'Paneer Makhani + Moong Dal + Roti + Rice + Chaas',
            dinner: 'Gourd Sabzi + Toor Dal + Phulka + Rice',
          },
        ],
        status: 'ACTIVE',
      },
    ];

    await this.messModel.create(initialMesses);
    this.logger.log('Initial verified mess outlets successfully seeded.');
    } catch (err: any) {
      this.logger.warn(`Initial mess seeding skipped or deferred: ${err.message}`);
    }
  }

  async findAll(query?: { city?: string; dietaryType?: string }): Promise<MessDocument[]> {
    const filter: Record<string, unknown> = { status: 'ACTIVE' };
    if (query?.city) {
      filter['address.city'] = new RegExp(`^${query.city}$`, 'i');
    }
    if (query?.dietaryType) {
      filter['dietaryType'] = query.dietaryType;
    }

    return this.messModel.find(filter).sort({ rating: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<MessDocument> {
    const mess = await this.messModel.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' }).exec();
    if (!mess) {
      throw new NotFoundException(`Mess outlet '${slug}' not found.`);
    }
    return mess;
  }

  async getPartnerMess(partnerId: string): Promise<MessDocument | null> {
    return this.messModel.findOne({ partnerId: new Types.ObjectId(partnerId) }).exec();
  }

  async updateWeeklyMenu(
    partnerId: string,
    messId: string,
    weeklyMenu: DailyMenu[],
  ): Promise<MessDocument> {
    if (!Types.ObjectId.isValid(messId)) {
      throw new BadRequestException('Invalid mess ID format.');
    }

    const mess = await this.messModel.findById(messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    if (mess.partnerId.toString() !== partnerId) {
      throw new ForbiddenException('You do not have permission to manage this mess.');
    }

    mess.weeklyMenu = weeklyMenu as any;
    await mess.save();

    this.logger.log(`Weekly menu updated for mess: ${mess.name} (${mess._id})`);
    return mess;
  }

  async createSubscription(
    studentId: string,
    dto: CreateMessSubscriptionDto,
  ): Promise<MessSubscriptionDocument> {
    if (!Types.ObjectId.isValid(dto.messId)) {
      throw new BadRequestException('Invalid mess ID format.');
    }

    const mess = await this.messModel.findById(dto.messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    const plan = mess.plans.find((p) => p.id === dto.planId);
    if (!plan) {
      throw new BadRequestException(`Meal plan '${dto.planId}' not found for this mess.`);
    }

    const startDate = new Date(dto.startDate);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date format.');
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day standard billing cycle

    const subscriptionNumber = this.generateSubscriptionNumber();
    const qrPassCode = `AG-MESS:${subscriptionNumber}:${studentId}:${dto.planId}`;

    const subscription = await this.subscriptionModel.create({
      subscriptionNumber,
      studentId: new Types.ObjectId(studentId),
      messId: mess._id,
      planId: plan.id,
      planName: plan.name,
      startDate,
      endDate,
      monthlyPrice: plan.monthlyPrice,
      dietaryPreference: dto.dietaryPreference || 'VEG',
      status: SubscriptionStatus.REQUESTED,
      qrPassCode,
    });

    this.logger.log(
      `Mess subscription created: ${subscription.subscriptionNumber} for student ${studentId} at ${mess.name}`,
    );

    const populated = await this.subscriptionModel
      .findById(subscription._id)
      .populate('messId')
      .populate('studentId', 'name phone email')
      .exec();

    return populated || subscription;
  }

  async getStudentSubscriptions(studentId: string): Promise<MessSubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('messId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPartnerSubscriptions(partnerId: string): Promise<MessSubscriptionDocument[]> {
    const mess = await this.messModel.findOne({ partnerId: new Types.ObjectId(partnerId) });
    if (!mess) {
      return [];
    }

    return this.subscriptionModel
      .find({ messId: mess._id })
      .populate('studentId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Retrieves food vendor partner profile details.
   */
  async getPartnerProfile(partnerId: string): Promise<MessPartnerProfileDocument | null> {
    return this.partnerProfileModel
      .findOne({ userId: new Types.ObjectId(partnerId) })
      .exec();
  }

  /**
   * Updates food vendor business and FSSAI details.
   */
  async updatePartnerProfile(
    partnerId: string,
    dto: UpdateVendorProfileDto,
  ): Promise<MessPartnerProfileDocument> {
    let profile = await this.partnerProfileModel.findOne({
      userId: new Types.ObjectId(partnerId),
    });
    if (!profile) {
      profile = new this.partnerProfileModel({
        userId: new Types.ObjectId(partnerId),
      });
    }

    if (dto.businessName !== undefined) profile.businessName = dto.businessName;
    if (dto.fssaiLicense !== undefined) profile.fssaiLicense = dto.fssaiLicense;
    if (dto.serviceAreas !== undefined) profile.serviceAreas = dto.serviceAreas;

    await profile.save();
    return profile;
  }

  /**
   * Creates a new mess/tiffin service outlet for vendor.
   * Defaults to INACTIVE and PENDING approval.
   */
  async createPartnerMess(partnerId: string, dto: CreateMessDto): Promise<MessDocument> {
    const partner = await this.userModel.findById(partnerId);
    if (partner && partner.roleApprovalStatus !== RoleApprovalStatus.APPROVED && partner.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_ROLE_PENDING_APPROVAL,
        message: 'Your food vendor account is pending administrative approval. You cannot create mess outlets until approved.',
      });
    }

    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;

    if (dto.location) {
      this.validateCoordinates(dto.location.coordinates);
    }

    const defaultLocation = {
      type: 'Point',
      coordinates: dto.location ? dto.location.coordinates : [77.209, 28.6139],
    };

    const mess = await this.messModel.create({
      partnerId: new Types.ObjectId(partnerId),
      name: dto.name,
      slug,
      description: dto.description,
      dietaryType: dto.dietaryType,
      fssaiNumber: dto.fssaiNumber,
      address: dto.address,
      location: defaultLocation,
      googlePlaceId: dto.googlePlaceId,
      deliveryRadiusKm: dto.deliveryRadiusKm || 5,
      deliveryTimings:
        dto.deliveryTimings || 'Breakfast: 8-10 AM, Lunch: 12-2 PM, Dinner: 7-9 PM',
      operatingHours: dto.operatingHours || {
        breakfast: '07:30 - 09:30',
        lunch: '12:30 - 14:30',
        dinner: '19:30 - 21:30',
      },
      images: dto.images || [],
      plans: dto.plans || [],
      weeklyMenu: [],
      status: 'INACTIVE',
      approvalStatus: ApprovalStatus.PENDING,
      isPhysicallyVerified: false,
    });

    this.logger.log(`Mess outlet created: ${mess.name} (${mess._id}) by partner ${partnerId}`);
    return mess;
  }

  /**
   * Updates an existing mess outlet managed by vendor.
   */
  async updatePartnerMess(
    partnerId: string,
    messId: string,
    role: UserRole,
    dto: UpdateMessDto,
  ): Promise<MessDocument> {
    if (!Types.ObjectId.isValid(messId)) {
      throw new BadRequestException('Invalid mess ID format.');
    }

    const mess = await this.messModel.findById(messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    if (role !== UserRole.ADMIN && mess.partnerId.toString() !== partnerId) {
      throw new ForbiddenException('You do not have permission to update this mess outlet.');
    }

    if (dto.name !== undefined) mess.name = dto.name;
    if (dto.description !== undefined) mess.description = dto.description;
    if (dto.dietaryType !== undefined) mess.dietaryType = dto.dietaryType;
    if (dto.fssaiNumber !== undefined) mess.fssaiNumber = dto.fssaiNumber;
    if (dto.address !== undefined) mess.address = dto.address as any;
    if (dto.googlePlaceId !== undefined) mess.googlePlaceId = dto.googlePlaceId;
    if (dto.deliveryRadiusKm !== undefined) mess.deliveryRadiusKm = dto.deliveryRadiusKm;
    if (dto.deliveryTimings !== undefined) mess.deliveryTimings = dto.deliveryTimings;
    if (dto.operatingHours !== undefined) mess.operatingHours = dto.operatingHours as any;
    if (dto.images !== undefined) mess.images = dto.images;
    if (dto.plans !== undefined) mess.plans = dto.plans as any;

    if (dto.location) {
      this.validateCoordinates(dto.location.coordinates);
      mess.location = {
        type: 'Point',
        coordinates: [dto.location.coordinates[0], dto.location.coordinates[1]],
      };
    }

    if (dto.status !== undefined && role === UserRole.ADMIN) {
      mess.status = dto.status;
    }

    await mess.save();
    return mess;
  }

  /**
   * Updates meal plans list for vendor's mess outlet.
   */
  async updateMealPlans(
    partnerId: string,
    messId: string,
    role: UserRole,
    dto: UpdateMealPlansDto,
  ): Promise<MessDocument> {
    if (!Types.ObjectId.isValid(messId)) {
      throw new BadRequestException('Invalid mess ID format.');
    }

    const mess = await this.messModel.findById(messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    if (role !== UserRole.ADMIN && mess.partnerId.toString() !== partnerId) {
      throw new ForbiddenException('You do not have permission to manage this mess.');
    }

    mess.plans = dto.plans as any;
    await mess.save();
    return mess;
  }

  /**
   * Vendor accepts or rejects a student dining subscription/order request.
   * Pure request-decision workflow. Does NOT collect payment or mark as paid.
   */
  async decideSubscription(
    partnerId: string,
    subscriptionId: string,
    role: UserRole,
    dto: SubscriptionDecisionDto,
  ): Promise<MessSubscriptionDocument> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new BadRequestException('Invalid subscription ID format.');
    }

    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription request not found.');
    }

    const mess = await this.messModel.findById(subscription.messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    if (role !== UserRole.ADMIN && mess.partnerId.toString() !== partnerId) {
      throw new ForbiddenException('You do not have permission to decide this subscription.');
    }

    if (dto.decision === 'ACCEPT') {
      subscription.status = SubscriptionStatus.ACCEPTED;
    } else if (dto.decision === 'REJECT') {
      subscription.status = SubscriptionStatus.REJECTED;
    } else if (dto.decision === 'COMPLETE') {
      subscription.status = SubscriptionStatus.COMPLETED;
    }

    if (dto.reason) {
      subscription.decisionNotes = dto.reason;
    }
    subscription.decidedAt = new Date();

    await subscription.save();
    this.logger.log(
      `Subscription ${subscription.subscriptionNumber} decision ${dto.decision} by partner ${partnerId}`,
    );
    return subscription;
  }

  private validateCoordinates(coords: [number, number]): void {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new BadRequestException('Location coordinates must be an array of [longitude, latitude].');
    }
    const [lng, lat] = coords;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      throw new BadRequestException('Coordinates must be valid numbers.');
    }
    if (lat < -90 || lat > 90) {
      throw new BadRequestException(`Latitude (${lat}) must be between -90 and 90 degrees.`);
    }
    if (lng < -180 || lng > 180) {
      throw new BadRequestException(`Longitude (${lng}) must be between -180 and 180 degrees.`);
    }
  }
}

