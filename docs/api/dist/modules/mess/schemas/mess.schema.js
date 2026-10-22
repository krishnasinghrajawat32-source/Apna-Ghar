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
exports.MessSchema = exports.Mess = exports.DailyMenuSchema = exports.MealPlanSchema = exports.OperatingHours = exports.MessAddress = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let MessAddress = class MessAddress {
    street;
    city;
    state;
    pincode;
    landmark;
};
exports.MessAddress = MessAddress;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MessAddress.prototype, "street", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], MessAddress.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MessAddress.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MessAddress.prototype, "pincode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], MessAddress.prototype, "landmark", void 0);
exports.MessAddress = MessAddress = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], MessAddress);
const MessAddressSchema = mongoose_1.SchemaFactory.createForClass(MessAddress);
let OperatingHours = class OperatingHours {
    breakfast;
    lunch;
    dinner;
};
exports.OperatingHours = OperatingHours;
__decorate([
    (0, mongoose_1.Prop)({ default: '07:30 - 09:30' }),
    __metadata("design:type", String)
], OperatingHours.prototype, "breakfast", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '12:30 - 14:30' }),
    __metadata("design:type", String)
], OperatingHours.prototype, "lunch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '19:30 - 21:30' }),
    __metadata("design:type", String)
], OperatingHours.prototype, "dinner", void 0);
exports.OperatingHours = OperatingHours = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], OperatingHours);
const OperatingHoursSchema = mongoose_1.SchemaFactory.createForClass(OperatingHours);
let MealPlanSchema = class MealPlanSchema {
    id;
    name;
    mealTypes;
    daysPerWeek;
    monthlyPrice;
    description;
};
exports.MealPlanSchema = MealPlanSchema;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MealPlanSchema.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MealPlanSchema.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], MealPlanSchema.prototype, "mealTypes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1, max: 7 }),
    __metadata("design:type", Number)
], MealPlanSchema.prototype, "daysPerWeek", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], MealPlanSchema.prototype, "monthlyPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], MealPlanSchema.prototype, "description", void 0);
exports.MealPlanSchema = MealPlanSchema = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], MealPlanSchema);
const MealPlanSubSchema = mongoose_1.SchemaFactory.createForClass(MealPlanSchema);
let DailyMenuSchema = class DailyMenuSchema {
    day;
    breakfast;
    lunch;
    snacks;
    dinner;
    specialDietNote;
};
exports.DailyMenuSchema = DailyMenuSchema;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        required: true,
    }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "breakfast", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "lunch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "snacks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "dinner", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], DailyMenuSchema.prototype, "specialDietNote", void 0);
exports.DailyMenuSchema = DailyMenuSchema = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DailyMenuSchema);
const DailyMenuSubSchema = mongoose_1.SchemaFactory.createForClass(DailyMenuSchema);
let Mess = class Mess {
    partnerId;
    name;
    slug;
    description;
    dietaryType;
    fssaiNumber;
    address;
    rating;
    hygieneCertified;
    operatingHours;
    plans;
    weeklyMenu;
    status;
};
exports.Mess = Mess;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Mess.prototype, "partnerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Mess.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true, index: true }),
    __metadata("design:type", String)
], Mess.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Mess.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'],
        default: 'PURE_VEG',
        index: true,
    }),
    __metadata("design:type", String)
], Mess.prototype, "dietaryType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Mess.prototype, "fssaiNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: MessAddressSchema, required: true }),
    __metadata("design:type", MessAddress)
], Mess.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 4.5, min: 1, max: 5 }),
    __metadata("design:type", Number)
], Mess.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Mess.prototype, "hygieneCertified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: OperatingHoursSchema, default: () => ({}) }),
    __metadata("design:type", OperatingHours)
], Mess.prototype, "operatingHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [MealPlanSubSchema], default: [] }),
    __metadata("design:type", Array)
], Mess.prototype, "plans", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [DailyMenuSubSchema], default: [] }),
    __metadata("design:type", Array)
], Mess.prototype, "weeklyMenu", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }),
    __metadata("design:type", String)
], Mess.prototype, "status", void 0);
exports.Mess = Mess = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'messes',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Mess);
exports.MessSchema = mongoose_1.SchemaFactory.createForClass(Mess);
exports.MessSchema.index({ 'address.city': 1, status: 1 });
exports.MessSchema.index({ partnerId: 1, status: 1 });
//# sourceMappingURL=mess.schema.js.map