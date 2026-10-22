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
exports.MessSubscriptionSchema = exports.MessSubscription = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let MessSubscription = class MessSubscription {
    subscriptionNumber;
    studentId;
    messId;
    planId;
    planName;
    startDate;
    endDate;
    monthlyPrice;
    dietaryPreference;
    status;
    qrPassCode;
};
exports.MessSubscription = MessSubscription;
__decorate([
    (0, mongoose_1.Prop)({ required: true, uppercase: true, trim: true }),
    __metadata("design:type", String)
], MessSubscription.prototype, "subscriptionNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MessSubscription.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Mess', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MessSubscription.prototype, "messId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MessSubscription.prototype, "planId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MessSubscription.prototype, "planName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], MessSubscription.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], MessSubscription.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], MessSubscription.prototype, "monthlyPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['VEG', 'NON_VEG', 'JAIN'],
        default: 'VEG',
    }),
    __metadata("design:type", String)
], MessSubscription.prototype, "dietaryPreference", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
        default: 'ACTIVE',
        index: true,
    }),
    __metadata("design:type", String)
], MessSubscription.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MessSubscription.prototype, "qrPassCode", void 0);
exports.MessSubscription = MessSubscription = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'messSubscriptions',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], MessSubscription);
exports.MessSubscriptionSchema = mongoose_1.SchemaFactory.createForClass(MessSubscription);
exports.MessSubscriptionSchema.index({ subscriptionNumber: 1 }, { unique: true });
exports.MessSubscriptionSchema.index({ studentId: 1, status: 1 });
exports.MessSubscriptionSchema.index({ messId: 1, status: 1 });
//# sourceMappingURL=mess-subscription.schema.js.map