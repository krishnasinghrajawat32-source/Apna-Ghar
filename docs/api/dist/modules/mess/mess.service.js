"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const mess_schema_1 = require("./schemas/mess.schema");
const mess_subscription_schema_1 = require("./schemas/mess-subscription.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
let MessService = MessService_1 = class MessService {
    messModel;
    subscriptionModel;
    userModel;
    logger = new common_1.Logger(MessService_1.name);
    constructor(messModel, subscriptionModel, userModel) {
        this.messModel = messModel;
        this.subscriptionModel = subscriptionModel;
        this.userModel = userModel;
    }
    async onModuleInit() {
        const isConnected = !this.messModel.db || this.messModel.db.readyState === 1;
        if (isConnected) {
            await this.seedInitialMesses();
        }
        else {
            this.messModel.db.once('connected', () => {
                this.seedInitialMesses().catch((err) => {
                    this.logger.warn(`Mess seeding skipped or deferred: ${err.message}`);
                });
            });
        }
    }
    generateSubscriptionNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = (0, crypto_1.randomBytes)(2).toString('hex').toUpperCase();
        return `MS-${dateStr}-${randomSuffix}`;
    }
    async seedInitialMesses() {
        try {
            const count = await this.messModel.countDocuments();
            if (count > 0)
                return;
            this.logger.log('Seeding initial verified student mess partners and outlets...');
            // Find or create default mess partner user
            let partner = await this.userModel.findOne({ email: 'mess@apnaghar.in' });
            if (!partner) {
                partner = await this.userModel.create({
                    name: 'Annapurna Food Services',
                    email: 'mess@apnaghar.in',
                    phone: '9876543299',
                    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$seedhash$seedhash',
                    role: shared_types_1.UserRole.MESS_PARTNER,
                });
            }
            const initialMesses = [
                {
                    partnerId: partner._id,
                    name: 'Annapurna Pure Veg Student Mess',
                    slug: 'annapurna-pure-veg-mess-kota',
                    description: 'Hygienic, homestyle pure vegetarian student dining. Unlimited rotis, high-protein dals, green seasonal vegetables, and pure filtered water.',
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
                    description: '100% Satvik cooking with dedicated zero-onion, zero-garlic Jain kitchen options. High hygiene, mineral water RO plant on-site.',
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
        catch (err) {
            this.logger.warn(`Initial mess seeding skipped or deferred: ${err.message}`);
        }
    }
    async findAll(query) {
        const filter = { status: 'ACTIVE' };
        if (query?.city) {
            filter['address.city'] = new RegExp(`^${query.city}$`, 'i');
        }
        if (query?.dietaryType) {
            filter['dietaryType'] = query.dietaryType;
        }
        return this.messModel.find(filter).sort({ rating: -1 }).exec();
    }
    async findBySlug(slug) {
        const mess = await this.messModel.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' }).exec();
        if (!mess) {
            throw new common_1.NotFoundException(`Mess outlet '${slug}' not found.`);
        }
        return mess;
    }
    async getPartnerMess(partnerId) {
        return this.messModel.findOne({ partnerId: new mongoose_2.Types.ObjectId(partnerId) }).exec();
    }
    async updateWeeklyMenu(partnerId, messId, weeklyMenu) {
        if (!mongoose_2.Types.ObjectId.isValid(messId)) {
            throw new common_1.BadRequestException('Invalid mess ID format.');
        }
        const mess = await this.messModel.findById(messId);
        if (!mess) {
            throw new common_1.NotFoundException('Mess outlet not found.');
        }
        if (mess.partnerId.toString() !== partnerId) {
            throw new common_1.ForbiddenException('You do not have permission to manage this mess.');
        }
        mess.weeklyMenu = weeklyMenu;
        await mess.save();
        this.logger.log(`Weekly menu updated for mess: ${mess.name} (${mess._id})`);
        return mess;
    }
    async createSubscription(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.messId)) {
            throw new common_1.BadRequestException('Invalid mess ID format.');
        }
        const mess = await this.messModel.findById(dto.messId);
        if (!mess) {
            throw new common_1.NotFoundException('Mess outlet not found.');
        }
        const plan = mess.plans.find((p) => p.id === dto.planId);
        if (!plan) {
            throw new common_1.BadRequestException(`Meal plan '${dto.planId}' not found for this mess.`);
        }
        const startDate = new Date(dto.startDate);
        if (isNaN(startDate.getTime())) {
            throw new common_1.BadRequestException('Invalid start date format.');
        }
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // 30-day standard billing cycle
        const subscriptionNumber = this.generateSubscriptionNumber();
        const qrPassCode = `AG-MESS:${subscriptionNumber}:${studentId}:${dto.planId}`;
        const subscription = await this.subscriptionModel.create({
            subscriptionNumber,
            studentId: new mongoose_2.Types.ObjectId(studentId),
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
        this.logger.log(`Mess subscription created: ${subscription.subscriptionNumber} for student ${studentId} at ${mess.name}`);
        const populated = await this.subscriptionModel
            .findById(subscription._id)
            .populate('messId')
            .populate('studentId', 'name phone email')
            .exec();
        return populated || subscription;
    }
    async getStudentSubscriptions(studentId) {
        return this.subscriptionModel
            .find({ studentId: new mongoose_2.Types.ObjectId(studentId) })
            .populate('messId')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getPartnerSubscriptions(partnerId) {
        const mess = await this.messModel.findOne({ partnerId: new mongoose_2.Types.ObjectId(partnerId) });
        if (!mess) {
            return [];
        }
        return this.subscriptionModel
            .find({ messId: mess._id })
            .populate('studentId', 'name phone email')
            .sort({ createdAt: -1 })
            .exec();
    }
};
exports.MessService = MessService;
exports.MessService = MessService = MessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mess_schema_1.Mess.name)),
    __param(1, (0, mongoose_1.InjectModel)(mess_subscription_schema_1.MessSubscription.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], MessService);
//# sourceMappingURL=mess.service.js.map