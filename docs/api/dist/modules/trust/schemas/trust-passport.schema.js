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
exports.TrustPassportSchema = exports.TrustPassport = exports.CheckpointItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let CheckpointItem = class CheckpointItem {
    type;
    status;
    verifiedAt;
    expiresAt;
    notes;
    verifiedBy;
};
exports.CheckpointItem = CheckpointItem;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.VerificationType),
        required: true,
    }),
    __metadata("design:type", String)
], CheckpointItem.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.VerificationStatus),
        default: shared_types_1.VerificationStatus.PENDING,
    }),
    __metadata("design:type", String)
], CheckpointItem.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CheckpointItem.prototype, "verifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CheckpointItem.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], CheckpointItem.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CheckpointItem.prototype, "verifiedBy", void 0);
exports.CheckpointItem = CheckpointItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CheckpointItem);
const CheckpointItemSchema = mongoose_1.SchemaFactory.createForClass(CheckpointItem);
let TrustPassport = class TrustPassport {
    propertyId;
    isFullyVerified;
    score; // 0 to 7 checkpoints verified
    lastVerifiedAt;
    checkpoints;
};
exports.TrustPassport = TrustPassport;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TrustPassport.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], TrustPassport.prototype, "isFullyVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], TrustPassport.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], TrustPassport.prototype, "lastVerifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CheckpointItemSchema], default: [] }),
    __metadata("design:type", Array)
], TrustPassport.prototype, "checkpoints", void 0);
exports.TrustPassport = TrustPassport = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'trust_passports',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], TrustPassport);
exports.TrustPassportSchema = mongoose_1.SchemaFactory.createForClass(TrustPassport);
//# sourceMappingURL=trust-passport.schema.js.map