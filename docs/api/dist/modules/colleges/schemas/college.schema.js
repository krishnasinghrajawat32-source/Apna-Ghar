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
exports.CollegeSchema = exports.College = exports.GeoLocation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let GeoLocation = class GeoLocation {
    type;
    // Canonical MongoDB coordinate format: [longitude, latitude]
    coordinates;
};
exports.GeoLocation = GeoLocation;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Point'], default: 'Point', required: true }),
    __metadata("design:type", String)
], GeoLocation.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], required: true }),
    __metadata("design:type", Array)
], GeoLocation.prototype, "coordinates", void 0);
exports.GeoLocation = GeoLocation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], GeoLocation);
const GeoLocationSchema = mongoose_1.SchemaFactory.createForClass(GeoLocation);
let College = class College {
    name;
    slug;
    city;
    state;
    location;
    status;
};
exports.College = College;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], College.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true, index: true }),
    __metadata("design:type", String)
], College.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], College.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], College.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: GeoLocationSchema, required: true }),
    __metadata("design:type", GeoLocation)
], College.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }),
    __metadata("design:type", String)
], College.prototype, "status", void 0);
exports.College = College = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'colleges',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], College);
exports.CollegeSchema = mongoose_1.SchemaFactory.createForClass(College);
// 2dsphere index for geospatial proximity search
exports.CollegeSchema.index({ location: '2dsphere' });
exports.CollegeSchema.index({ name: 'text', city: 'text' });
//# sourceMappingURL=college.schema.js.map