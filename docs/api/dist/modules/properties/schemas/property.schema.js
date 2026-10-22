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
exports.PropertySchema = exports.Property = exports.PropertyAddress = exports.PropertyGeoLocation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let PropertyGeoLocation = class PropertyGeoLocation {
    type;
    // Canonical MongoDB coordinate format: [longitude, latitude]
    coordinates;
};
exports.PropertyGeoLocation = PropertyGeoLocation;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Point'], default: 'Point', required: true }),
    __metadata("design:type", String)
], PropertyGeoLocation.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], required: true }),
    __metadata("design:type", Array)
], PropertyGeoLocation.prototype, "coordinates", void 0);
exports.PropertyGeoLocation = PropertyGeoLocation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PropertyGeoLocation);
const PropertyGeoLocationSchema = mongoose_1.SchemaFactory.createForClass(PropertyGeoLocation);
let PropertyAddress = class PropertyAddress {
    street;
    landmark;
    city;
    state;
    pincode;
};
exports.PropertyAddress = PropertyAddress;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PropertyAddress.prototype, "street", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], PropertyAddress.prototype, "landmark", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], PropertyAddress.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PropertyAddress.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PropertyAddress.prototype, "pincode", void 0);
exports.PropertyAddress = PropertyAddress = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PropertyAddress);
const PropertyAddressSchema = mongoose_1.SchemaFactory.createForClass(PropertyAddress);
let Property = class Property {
    ownerId;
    name;
    slug;
    propertyType;
    description;
    address;
    location;
    genderPreference;
    furnishing;
    status;
    amenities;
    rules;
    images;
    isFullyVerified;
    rating;
    reviewCount;
    lastAvailabilityUpdatedAt;
};
exports.Property = Property;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Property.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Property.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true, index: true }),
    __metadata("design:type", String)
], Property.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.PropertyType),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Property.prototype, "propertyType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Property.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PropertyAddressSchema, required: true }),
    __metadata("design:type", PropertyAddress)
], Property.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PropertyGeoLocationSchema, required: true }),
    __metadata("design:type", PropertyGeoLocation)
], Property.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.GenderPreference),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Property.prototype, "genderPreference", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.FurnishingType),
        default: shared_types_1.FurnishingType.FULLY_FURNISHED,
    }),
    __metadata("design:type", String)
], Property.prototype, "furnishing", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.PropertyStatus),
        default: shared_types_1.PropertyStatus.ACTIVE,
        index: true,
    }),
    __metadata("design:type", String)
], Property.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Property.prototype, "amenities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Property.prototype, "rules", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Property.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], Property.prototype, "isFullyVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0, max: 5 }),
    __metadata("design:type", Number)
], Property.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0 }),
    __metadata("design:type", Number)
], Property.prototype, "reviewCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], Property.prototype, "lastAvailabilityUpdatedAt", void 0);
exports.Property = Property = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'properties',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Property);
exports.PropertySchema = mongoose_1.SchemaFactory.createForClass(Property);
// Critical 2dsphere index for proximity queries
exports.PropertySchema.index({ location: '2dsphere' });
exports.PropertySchema.index({ status: 1, genderPreference: 1 });
exports.PropertySchema.index({ ownerId: 1, createdAt: -1 });
//# sourceMappingURL=property.schema.js.map