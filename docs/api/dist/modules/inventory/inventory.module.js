"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const room_type_schema_1 = require("./schemas/room-type.schema");
const room_schema_1 = require("./schemas/room.schema");
const bed_schema_1 = require("./schemas/bed.schema");
const inventory_service_1 = require("./inventory.service");
const inventory_controller_1 = require("./inventory.controller");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: room_type_schema_1.RoomType.name, schema: room_type_schema_1.RoomTypeSchema },
                { name: room_schema_1.Room.name, schema: room_schema_1.RoomSchema },
                { name: bed_schema_1.Bed.name, schema: bed_schema_1.BedSchema },
            ]),
        ],
        controllers: [inventory_controller_1.InventoryController],
        providers: [inventory_service_1.InventoryService],
        exports: [inventory_service_1.InventoryService, mongoose_1.MongooseModule],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map