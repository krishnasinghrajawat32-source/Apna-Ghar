"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const configuration_1 = __importDefault(require("./config/configuration"));
const database_module_1 = require("./database/database.module");
const redis_module_1 = require("./redis/redis.module");
const health_module_1 = require("./modules/health/health.module");
const users_module_1 = require("./modules/users/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
const colleges_module_1 = require("./modules/colleges/colleges.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const search_module_1 = require("./modules/search/search.module");
const properties_module_1 = require("./modules/properties/properties.module");
const trust_module_1 = require("./modules/trust/trust.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
const visits_module_1 = require("./modules/visits/visits.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const payments_module_1 = require("./modules/payments/payments.module");
const tickets_module_1 = require("./modules/tickets/tickets.module");
const owner_module_1 = require("./modules/owner/owner.module");
const mess_module_1 = require("./modules/mess/mess.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const admin_module_1 = require("./modules/admin/admin.module");
const app_controller_1 = require("./app.controller");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 120,
                },
            ]),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            health_module_1.HealthModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            colleges_module_1.CollegesModule,
            inventory_module_1.InventoryModule,
            search_module_1.SearchModule,
            properties_module_1.PropertiesModule,
            trust_module_1.TrustModule,
            pricing_module_1.PricingModule,
            visits_module_1.VisitsModule,
            bookings_module_1.BookingsModule,
            payments_module_1.PaymentsModule,
            tickets_module_1.TicketsModule,
            owner_module_1.OwnerModule,
            mess_module_1.MessModule,
            reviews_module_1.ReviewsModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map