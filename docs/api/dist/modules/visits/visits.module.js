"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const visit_schema_1 = require("./schemas/visit.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const visits_service_1 = require("./visits.service");
const visits_controller_1 = require("./visits.controller");
let VisitsModule = class VisitsModule {
};
exports.VisitsModule = VisitsModule;
exports.VisitsModule = VisitsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: visit_schema_1.Visit.name, schema: visit_schema_1.VisitSchema },
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
            ]),
        ],
        controllers: [visits_controller_1.VisitsController],
        providers: [visits_service_1.VisitsService],
        exports: [visits_service_1.VisitsService],
    })
], VisitsModule);
//# sourceMappingURL=visits.module.js.map