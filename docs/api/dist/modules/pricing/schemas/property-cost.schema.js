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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyCostSchema = exports.PropertyCost = exports.CostLineItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let CostLineItem = class CostLineItem {
    name;
    amount;
    category;
    frequency;
    description;
};
exports.CostLineItem = CostLineItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], CostLineItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], CostLineItem.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.CostCategory),
        default: shared_types_1.CostCategory.FIXED,
    }),
    __metadata("design:type", String)
], CostLineItem.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['MONTHLY', 'ONE_TIME', 'ANNUAL'],
        default: 'MONTHLY',
    }),
    __metadata("design:type", String)
], CostLineItem.prototype, "frequency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], CostLineItem.prototype, "description", void 0);
exports.CostLineItem = CostLineItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CostLineItem);
const CostLineItemSchema = mongoose_1.SchemaFactory.createForClass(CostLineItem);
let PropertyCost = class PropertyCost {
    propertyId;
    roomTypeId;
    baseRent;
    securityDeposit;
    depositRefundable;
    noticePeriodDays;
    foodEstimate;
    electricityEstimate;
    maintenance;
    laundry;
    internet;
    commuteEstimate;
    otherRecurring;
    estimatedMonthlyTotal;
    lineItems;
};
exports.PropertyCost = PropertyCost;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PropertyCost.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'RoomType', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PropertyCost.prototype, "roomTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "baseRent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "securityDeposit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PropertyCost.prototype, "depositRefundable", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 30 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "noticePeriodDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "foodEstimate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "electricityEstimate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "maintenance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "laundry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "internet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "commuteEstimate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "otherRecurring", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PropertyCost.prototype, "estimatedMonthlyTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CostLineItemSchema], default: [] }),
    __metadata("design:type", Array)
], PropertyCost.prototype, "lineItems", void 0);
exports.PropertyCost = PropertyCost = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'property_costs',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], PropertyCost);
exports.PropertyCostSchema = mongoose_1.SchemaFactory.createForClass(PropertyCost);
exports.PropertyCostSchema.index({ propertyId: 1, roomTypeId: 1 });
//# sourceMappingURL=property-cost.schema.js.map