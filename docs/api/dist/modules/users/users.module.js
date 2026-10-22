"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const student_profile_schema_1 = require("./schemas/student-profile.schema");
const owner_profile_schema_1 = require("./schemas/owner-profile.schema");
const mess_partner_profile_schema_1 = require("./schemas/mess-partner-profile.schema");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: student_profile_schema_1.StudentProfile.name, schema: student_profile_schema_1.StudentProfileSchema },
                { name: owner_profile_schema_1.OwnerProfile.name, schema: owner_profile_schema_1.OwnerProfileSchema },
                { name: mess_partner_profile_schema_1.MessPartnerProfile.name, schema: mess_partner_profile_schema_1.MessPartnerProfileSchema },
            ]),
        ],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService, mongoose_1.MongooseModule],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map