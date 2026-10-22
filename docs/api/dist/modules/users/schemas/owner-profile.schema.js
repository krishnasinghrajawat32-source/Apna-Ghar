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
exports.OwnerProfileSchema = exports.OwnerProfile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let OwnerProfile = class OwnerProfile {
    userId;
    companyName;
    panNumber;
    aadhaarVerified;
    businessAddress;
};
exports.OwnerProfile = OwnerProfile;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OwnerProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], OwnerProfile.prototype, "companyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], OwnerProfile.prototype, "panNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], OwnerProfile.prototype, "aadhaarVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], OwnerProfile.prototype, "businessAddress", void 0);
exports.OwnerProfile = OwnerProfile = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'ownerProfiles',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], OwnerProfile);
exports.OwnerProfileSchema = mongoose_1.SchemaFactory.createForClass(OwnerProfile);
//# sourceMappingURL=owner-profile.schema.js.map