"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const owner_controller_1 = require("./owner.controller");
const owner_service_1 = require("./owner.service");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_schema_1 = require("../inventory/schemas/room.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const visit_schema_1 = require("../visits/schemas/visit.schema");
const ticket_schema_1 = require("../tickets/schemas/ticket.schema");
let OwnerModule = class OwnerModule {
};
exports.OwnerModule = OwnerModule;
exports.OwnerModule = OwnerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
                { name: room_schema_1.Room.name, schema: room_schema_1.RoomSchema },
                { name: bed_schema_1.Bed.name, schema: bed_schema_1.BedSchema },
                { name: room_type_schema_1.RoomType.name, schema: room_type_schema_1.RoomTypeSchema },
                { name: booking_schema_1.Booking.name, schema: booking_schema_1.BookingSchema },
                { name: visit_schema_1.Visit.name, schema: visit_schema_1.VisitSchema },
                { name: ticket_schema_1.Ticket.name, schema: ticket_schema_1.TicketSchema },
            ]),
        ],
        controllers: [owner_controller_1.OwnerController],
        providers: [owner_service_1.OwnerService],
        exports: [owner_service_1.OwnerService],
    })
], OwnerModule);
//# sourceMappingURL=owner.module.js.map