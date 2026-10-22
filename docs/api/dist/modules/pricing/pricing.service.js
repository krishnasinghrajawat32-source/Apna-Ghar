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
var PricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const property_cost_schema_1 = require("./schemas/property-cost.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
let PricingService = PricingService_1 = class PricingService {
    propertyCostModel;
    propertyModel;
    roomTypeModel;
    logger = new common_1.Logger(PricingService_1.name);
    constructor(propertyCostModel, propertyModel, roomTypeModel) {
        this.propertyCostModel = propertyCostModel;
        this.propertyModel = propertyModel;
        this.roomTypeModel = roomTypeModel;
    }
    async onModuleInit() {
        const isConnected = !this.propertyCostModel.db || this.propertyCostModel.db.readyState === 1;
        if (isConnected) {
            await this.seedInitialCosts();
        }
        else {
            this.propertyCostModel.db.once('connected', () => {
                this.seedInitialCosts().catch((err) => {
                    this.logger.warn(`Pricing seeding skipped or deferred: ${err.message}`);
                });
            });
        }
    }
    /**
     * Retrieves complete Total Living Cost breakdown for a property and optional room type
     */
    async getCostBreakdown(propertyId, roomTypeId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.NotFoundException(`Invalid property ID: ${propertyId}`);
        }
        const property = await this.propertyModel.findById(propertyId).exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with ID ${propertyId} not found`);
        }
        // Try finding specific cost structure for roomTypeId
        let costDoc = null;
        let roomTypeDoc = null;
        if (roomTypeId && mongoose_2.Types.ObjectId.isValid(roomTypeId)) {
            roomTypeDoc = await this.roomTypeModel.findById(roomTypeId).exec();
            costDoc = await this.propertyCostModel.findOne({
                propertyId: new mongoose_2.Types.ObjectId(propertyId),
                roomTypeId: new mongoose_2.Types.ObjectId(roomTypeId),
            }).exec();
        }
        // Fall back to general property cost structure
        if (!costDoc) {
            costDoc = await this.propertyCostModel.findOne({
                propertyId: new mongoose_2.Types.ObjectId(propertyId),
            }).exec();
        }
        // If still no cost document exists, build dynamic calculation from room type or sensible defaults
        if (!costDoc) {
            const baseRent = roomTypeDoc?.baseRent || 8000;
            const deposit = roomTypeDoc?.deposit || baseRent;
            const dynamicLineItems = [
                {
                    name: 'Monthly Room Rent',
                    amount: baseRent,
                    category: shared_types_1.CostCategory.FIXED,
                    frequency: 'MONTHLY',
                    description: 'Includes accommodation and basic utilities',
                },
                {
                    name: 'Estimated Electricity (Sub-metered)',
                    amount: 800,
                    category: shared_types_1.CostCategory.ESTIMATED,
                    frequency: 'MONTHLY',
                    description: 'Metered per unit consumption',
                },
                {
                    name: 'Maintenance & Cleaning',
                    amount: 300,
                    category: shared_types_1.CostCategory.FIXED,
                    frequency: 'MONTHLY',
                    description: 'Daily housekeeping and waste management',
                },
            ];
            const monthlyTotal = baseRent + 800 + 300;
            return {
                propertyId,
                roomTypeId: roomTypeDoc?._id.toString(),
                roomTypeName: roomTypeDoc?.name || 'Standard Accommodation',
                upfrontMoveInTotal: deposit + baseRent,
                securityDeposit: deposit,
                depositRefundable: true,
                noticePeriodDays: 30,
                totalLivingCost: {
                    rent: baseRent,
                    foodEstimate: 0,
                    electricityEstimate: 800,
                    maintenance: 300,
                    laundry: 0,
                    internet: 0,
                    commuteEstimate: 0,
                    otherRecurring: 0,
                    estimatedMonthlyTotal: monthlyTotal,
                    lineItems: dynamicLineItems,
                },
            };
        }
        const upfrontMoveIn = costDoc.securityDeposit + costDoc.baseRent;
        const totalLivingCost = {
            rent: costDoc.baseRent,
            foodEstimate: costDoc.foodEstimate,
            electricityEstimate: costDoc.electricityEstimate,
            maintenance: costDoc.maintenance,
            laundry: costDoc.laundry,
            internet: costDoc.internet,
            commuteEstimate: costDoc.commuteEstimate,
            otherRecurring: costDoc.otherRecurring,
            estimatedMonthlyTotal: costDoc.estimatedMonthlyTotal,
            lineItems: costDoc.lineItems.map((item) => ({
                name: item.name,
                amount: item.amount,
                category: item.category,
                frequency: item.frequency,
                description: item.description,
            })),
        };
        return {
            propertyId,
            roomTypeId: costDoc.roomTypeId ? costDoc.roomTypeId.toString() : roomTypeDoc?._id.toString(),
            roomTypeName: roomTypeDoc?.name,
            upfrontMoveInTotal: upfrontMoveIn,
            securityDeposit: costDoc.securityDeposit,
            depositRefundable: costDoc.depositRefundable,
            noticePeriodDays: costDoc.noticePeriodDays,
            totalLivingCost,
        };
    }
    /**
     * Seeds initial transparent cost structures for seeded properties
     */
    async seedInitialCosts() {
        try {
            const properties = await this.propertyModel.find().exec();
            for (const prop of properties) {
                const roomTypes = await this.roomTypeModel.find({ propertyId: prop._id }).exec();
                for (const rt of roomTypes) {
                    const existing = await this.propertyCostModel.findOne({
                        propertyId: prop._id,
                        roomTypeId: rt._id,
                    }).exec();
                    if (!existing) {
                        const isSingle = rt.sharingType === 'SINGLE';
                        const rent = rt.baseRent;
                        const deposit = rt.deposit;
                        const electricity = isSingle ? 1000 : 700;
                        const maintenance = 350;
                        const totalMonthly = rent + electricity + maintenance;
                        const lineItems = [
                            {
                                name: 'Room Rent',
                                amount: rent,
                                category: shared_types_1.CostCategory.FIXED,
                                frequency: 'MONTHLY',
                                description: 'Base accommodation fee including 3 daily nutritious meals',
                            },
                            {
                                name: 'Electricity Consumption (Estimated)',
                                amount: electricity,
                                category: shared_types_1.CostCategory.ESTIMATED,
                                frequency: 'MONTHLY',
                                description: 'Metered AC/room consumption billed at ₹9.00/unit',
                            },
                            {
                                name: 'Housekeeping & Maintenance',
                                amount: maintenance,
                                category: shared_types_1.CostCategory.FIXED,
                                frequency: 'MONTHLY',
                                description: 'Daily room cleaning, common area upkeep, and waste collection',
                            },
                            {
                                name: 'High-Speed Wi-Fi (150 Mbps)',
                                amount: 0,
                                category: shared_types_1.CostCategory.FIXED,
                                frequency: 'MONTHLY',
                                description: 'Complimentary high-speed optical fiber internet',
                            },
                            {
                                name: 'Commute to Campus',
                                amount: 0,
                                category: shared_types_1.CostCategory.ESTIMATED,
                                frequency: 'MONTHLY',
                                description: 'Walking distance (under 300 meters from campus gate)',
                            },
                        ];
                        await this.propertyCostModel.create({
                            propertyId: prop._id,
                            roomTypeId: rt._id,
                            baseRent: rent,
                            securityDeposit: deposit,
                            depositRefundable: true,
                            noticePeriodDays: 30,
                            foodEstimate: 0, // Included in rent!
                            electricityEstimate: electricity,
                            maintenance,
                            laundry: 0,
                            internet: 0,
                            commuteEstimate: 0,
                            otherRecurring: 0,
                            estimatedMonthlyTotal: totalMonthly,
                            lineItems,
                        });
                        this.logger.log(`Seeded Total Living Cost for ${prop.name} - ${rt.name} (Rent: ₹${rent}, Monthly Total: ₹${totalMonthly})`);
                    }
                }
            }
        }
        catch (err) {
            this.logger.warn(`Initial pricing seeding skipped or deferred: ${err.message}`);
        }
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_cost_schema_1.PropertyCost.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(2, (0, mongoose_1.InjectModel)(room_type_schema_1.RoomType.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PricingService);
//# sourceMappingURL=pricing.service.js.map