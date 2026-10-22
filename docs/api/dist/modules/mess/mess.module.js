"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mess_schema_1 = require("./schemas/mess.schema");
const mess_subscription_schema_1 = require("./schemas/mess-subscription.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const mess_controller_1 = require("./mess.controller");
const mess_service_1 = require("./mess.service");
let MessModule = class MessModule {
};
exports.MessModule = MessModule;
exports.MessModule = MessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: mess_schema_1.Mess.name, schema: mess_schema_1.MessSchema },
                { name: mess_subscription_schema_1.MessSubscription.name, schema: mess_subscription_schema_1.MessSubscriptionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        controllers: [mess_controller_1.MessController],
        providers: [mess_service_1.MessService],
        exports: [mess_service_1.MessService],
    })
], MessModule);
//# sourceMappingURL=mess.module.js.map