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
import { CreateMessSubscriptionDto } from './dto/create-mess-subscription.dto';
import { DailyMenu, UserRole } from '@apna-ghar/shared-types';

@Injectable()
export class MessService implements OnModuleInit {
  private readonly logger = new Logger(MessService.name);

  constructor(
    @InjectModel(Mess.name) private readonly messModel: Model<MessDocument>,
    @InjectModel(MessSubscription.name)
    private readonly subscriptionModel: Model<MessSubscriptionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    await this.seedInitialMesses();
  }

  private generateSubscriptionNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = randomBytes(2).toString('hex').toUpperCase();
    return `MS-${dateStr}-${randomSuffix}`;
  }

  private async seedInitialMesses() {
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
      status: 'ACTIVE',
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
}
