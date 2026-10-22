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
exports.BookingSchema = exports.Booking = exports.EmergencyContactSchema = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let EmergencyContactSchema = class EmergencyContactSchema {
    name;
    relationship;
    phone;
};
exports.EmergencyContactSchema = EmergencyContactSchema;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], EmergencyContactSchema.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], EmergencyContactSchema.prototype, "relationship", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], EmergencyContactSchema.prototype, "phone", void 0);
exports.EmergencyContactSchema = EmergencyContactSchema = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], EmergencyContactSchema);
let Booking = class Booking {
    bookingReference;
    studentId;
    propertyId;
    roomTypeId;
    roomId;
    bedId;
    moveInDate;
    rentAmount;
    depositAmount;
    maintenanceFee;
    moveInCharges;
    totalInitialPayment;
    status;
    emergencyContact;
    studentIdCardRef;
    cancelledReason;
    cancellationDate;
};
exports.Booking = Booking;
__decorate([
    (0, mongoose_1.Prop)({ required: true, uppercase: true, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "bookingReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'RoomType', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "roomTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Room', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Bed', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "bedId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Booking.prototype, "moveInDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "rentAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "depositAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "maintenanceFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "moveInCharges", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "totalInitialPayment", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.BookingStatus),
        default: shared_types_1.BookingStatus.PENDING_PAYMENT,
        index: true,
    }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EmergencyContactSchema, required: true }),
    __metadata("design:type", EmergencyContactSchema)
], Booking.prototype, "emergencyContact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", String)
], Booking.prototype, "studentIdCardRef", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", String)
], Booking.prototype, "cancelledReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Booking.prototype, "cancellationDate", void 0);
exports.Booking = Booking = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'bookings',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Booking);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(Booking);
exports.BookingSchema.index({ studentId: 1, createdAt: -1 });
exports.BookingSchema.index({ propertyId: 1, status: 1 });
exports.BookingSchema.index({ bedId: 1, status: 1 });
exports.BookingSchema.index({ bookingReference: 1 }, { unique: true });
//# sourceMappingURL=booking.schema.js.map