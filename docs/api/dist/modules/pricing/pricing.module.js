"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const property_cost_schema_1 = require("./schemas/property-cost.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const properties_module_1 = require("../properties/properties.module");
const pricing_service_1 = require("./pricing.service");
const pricing_controller_1 = require("./pricing.controller");
let PricingModule = class PricingModule {
};
exports.PricingModule = PricingModule;
exports.PricingModule = PricingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: property_cost_schema_1.PropertyCost.name, schema: property_cost_schema_1.PropertyCostSchema },
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
                { name: room_type_schema_1.RoomType.name, schema: room_type_schema_1.RoomTypeSchema },
            ]),
            properties_module_1.PropertiesModule,
        ],
        controllers: [pricing_controller_1.PricingController],
        providers: [pricing_service_1.PricingService],
        exports: [pricing_service_1.PricingService],
    })
], PricingModule);
//# sourceMappingURL=pricing.module.js.map