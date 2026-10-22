"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const trust_passport_schema_1 = require("./schemas/trust-passport.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const trust_service_1 = require("./trust.service");
const trust_controller_1 = require("./trust.controller");
let TrustModule = class TrustModule {
};
exports.TrustModule = TrustModule;
exports.TrustModule = TrustModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: trust_passport_schema_1.TrustPassport.name, schema: trust_passport_schema_1.TrustPassportSchema },
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
            ]),
        ],
        controllers: [trust_controller_1.TrustController],
        providers: [trust_service_1.TrustService],
        exports: [trust_service_1.TrustService],
    })
], TrustModule);
//# sourceMappingURL=trust.module.js.map