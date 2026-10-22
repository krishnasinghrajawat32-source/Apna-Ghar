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
exports.RoomTypeSchema = exports.RoomType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let RoomType = class RoomType {
    propertyId;
    name;
    sharingType;
    baseRent;
    deposit;
    attachedBathroom;
    ac;
    foodIncluded;
    furnishingDetails;
};
exports.RoomType = RoomType;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], RoomType.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], RoomType.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.SharingType),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], RoomType.prototype, "sharingType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, index: true }),
    __metadata("design:type", Number)
], RoomType.prototype, "baseRent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], RoomType.prototype, "deposit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], RoomType.prototype, "attachedBathroom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], RoomType.prototype, "ac", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], RoomType.prototype, "foodIncluded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], RoomType.prototype, "furnishingDetails", void 0);
exports.RoomType = RoomType = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'roomTypes',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], RoomType);
exports.RoomTypeSchema = mongoose_1.SchemaFactory.createForClass(RoomType);
exports.RoomTypeSchema.index({ propertyId: 1, baseRent: 1 });
exports.RoomTypeSchema.index({ propertyId: 1, sharingType: 1 });
//# sourceMappingURL=room-type.schema.js.map