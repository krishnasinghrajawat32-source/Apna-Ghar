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
exports.BedSchema = exports.Bed = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let Bed = class Bed {
    propertyId;
    roomId;
    roomTypeId;
    bedLabel;
    position;
    permanentStatus;
    expectedVacancyDate;
};
exports.Bed = Bed;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bed.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Room', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bed.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'RoomType', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Bed.prototype, "roomTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Bed.prototype, "bedLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['WINDOW', 'CORNER', 'DOOR', 'STANDARD'],
        default: 'STANDARD',
    }),
    __metadata("design:type", String)
], Bed.prototype, "position", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.BedStatus),
        default: shared_types_1.BedStatus.AVAILABLE,
        index: true,
    }),
    __metadata("design:type", String)
], Bed.prototype, "permanentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Bed.prototype, "expectedVacancyDate", void 0);
exports.Bed = Bed = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'beds',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Bed);
exports.BedSchema = mongoose_1.SchemaFactory.createForClass(Bed);
exports.BedSchema.index({ propertyId: 1, permanentStatus: 1 });
exports.BedSchema.index({ roomId: 1, permanentStatus: 1 });
exports.BedSchema.index({ roomTypeId: 1, permanentStatus: 1 });
exports.BedSchema.index({ roomId: 1, bedLabel: 1 }, { unique: true });
//# sourceMappingURL=bed.schema.js.map