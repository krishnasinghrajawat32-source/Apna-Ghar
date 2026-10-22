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
exports.RoomSchema = exports.Room = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Room = class Room {
    propertyId;
    roomTypeId;
    floorNumber;
    roomNumber;
    status;
};
exports.Room = Room;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Property', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Room.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'RoomType', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Room.prototype, "roomTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Room.prototype, "floorNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Room.prototype, "roomNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['ACTIVE', 'MAINTENANCE'], default: 'ACTIVE' }),
    __metadata("design:type", String)
], Room.prototype, "status", void 0);
exports.Room = Room = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'rooms',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Room);
exports.RoomSchema = mongoose_1.SchemaFactory.createForClass(Room);
exports.RoomSchema.index({ propertyId: 1, floorNumber: 1 });
exports.RoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
//# sourceMappingURL=room.schema.js.map