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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const redis_service_1 = require("../../redis/redis.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let HealthController = class HealthController {
    mongoConnection;
    redisService;
    startTime = Date.now();
    constructor(mongoConnection, redisService) {
        this.mongoConnection = mongoConnection;
        this.redisService = redisService;
    }
    async check() {
        // Check MongoDB: 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
        const isMongoConnected = this.mongoConnection.readyState === 1;
        // Check Redis: ping() responds with 'PONG'
        let isRedisOk = false;
        try {
            const pingRes = await this.redisService.ping();
            isRedisOk = pingRes === 'PONG';
        }
        catch {
            isRedisOk = false;
        }
        const isHealthy = isMongoConnected && isRedisOk;
        return {
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            services: {
                database: {
                    status: isMongoConnected ? 'connected' : 'disconnected',
                    type: 'mongodb',
                },
                cache: {
                    status: isRedisOk ? 'connected' : 'error',
                    type: 'redis',
                },
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness & Readiness probe for MongoDB and Redis' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status check response' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('health'),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map