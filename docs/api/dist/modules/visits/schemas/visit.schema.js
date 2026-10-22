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
exports.VisitSchema = exports.Visit = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let Visit = class Visit {
    studentId;
    propertyId;
    ownerId;
    scheduledAt;
    slot;
    status;
    contactPhone;
    notes;
    cancelledReason;
};
exports.Visit = Visit;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Visit.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Visit.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Visit.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, index: true }),
    __metadata("design:type", Date)
], Visit.prototype, "scheduledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '10:00-12:00', trim: true }),
    __metadata("design:type", String)
], Visit.prototype, "slot", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.VisitStatus),
        default: shared_types_1.VisitStatus.REQUESTED,
        index: true,
    }),
    __metadata("design:type", String)
], Visit.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Visit.prototype, "contactPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Visit.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Visit.prototype, "cancelledReason", void 0);
exports.Visit = Visit = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'visits',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Visit);
exports.VisitSchema = mongoose_1.SchemaFactory.createForClass(Visit);
exports.VisitSchema.index({ studentId: 1, scheduledAt: -1 });
exports.VisitSchema.index({ ownerId: 1, scheduledAt: -1 });
exports.VisitSchema.index({ propertyId: 1, scheduledAt: 1 });
//# sourceMappingURL=visit.schema.js.map