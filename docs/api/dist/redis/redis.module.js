"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const ioredis_mock_1 = __importDefault(require("ioredis-mock"));
const redis_service_1 = require("./redis.service");
const redis_constants_1 = require("./redis.constants");
__exportStar(require("./redis.constants"), exports);
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: redis_constants_1.REDIS_CLIENT,
                useFactory: async (configService) => {
                    const logger = new common_1.Logger('RedisModule');
                    const redisUrl = configService.get('redisUrl') || 'redis://127.0.0.1:6379';
                    try {
                        const client = new ioredis_1.default(redisUrl, {
                            lazyConnect: true,
                            maxRetriesPerRequest: 1,
                            connectTimeout: 1500,
                            retryStrategy: () => null,
                        });
                        client.on('error', (err) => {
                            logger.debug(`Redis client status notice: ${err.message}`);
                        });
                        await client.connect();
                        logger.log(`Connected to live Redis at ${redisUrl}`);
                        client.__isMock = false;
                        return client;
                    }
                    catch (err) {
                        const errMsg = err instanceof Error ? err.message : String(err);
                        const nodeEnv = configService.get('nodeEnv') || process.env.NODE_ENV || 'development';
                        if (nodeEnv === 'production') {
                            logger.warn(`⚠️ PRODUCTION ALERT: Could not connect to managed Redis (${errMsg}). Live distributed locks are unavailable. Ensure REDIS_URL is configured in Render dashboard.`);
                        }
                        else {
                            logger.warn(`Unable to connect to live Redis (${errMsg}). Initializing fully-compatible in-memory Redis mock for local development and testing.`);
                        }
                        const mockClient = new ioredis_mock_1.default();
                        mockClient.__isMock = true;
                        return mockClient;
                    }
                },
                inject: [config_1.ConfigService],
            },
            redis_service_1.RedisService,
        ],
        exports: [redis_constants_1.REDIS_CLIENT, redis_service_1.RedisService],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map