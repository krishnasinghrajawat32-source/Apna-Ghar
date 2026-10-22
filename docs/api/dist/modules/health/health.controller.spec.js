"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("./health.controller");
const mongoose_1 = require("@nestjs/mongoose");
const redis_service_1 = require("../../redis/redis.service");
describe('HealthController', () => {
    let healthController;
    const mockMongoConnection = {
        readyState: 1, // 1 = connected
    };
    const mockRedisService = {
        ping: jest.fn().mockResolvedValue('PONG'),
    };
    beforeEach(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [
                {
                    provide: (0, mongoose_1.getConnectionToken)(),
                    useValue: mockMongoConnection,
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: mockRedisService,
                },
            ],
        }).compile();
        healthController = moduleRef.get(health_controller_1.HealthController);
    });
    it('should be defined', () => {
        expect(healthController).toBeDefined();
    });
    it('should return healthy status when MongoDB and Redis are connected', async () => {
        const health = await healthController.check();
        expect(health.status).toBe('ok');
        expect(health.version).toBe('1.0.0');
        expect(health.services.database.status).toBe('connected');
        expect(health.services.database.type).toBe('mongodb');
        expect(health.services.cache.status).toBe('connected');
        expect(health.services.cache.type).toBe('redis');
    });
    it('should return degraded status when Redis ping fails', async () => {
        mockRedisService.ping.mockRejectedValueOnce(new Error('Connection failure'));
        const health = await healthController.check();
        expect(health.status).toBe('degraded');
        expect(health.services.cache.status).toBe('error');
        expect(health.services.database.status).toBe('connected');
    });
});
//# sourceMappingURL=health.controller.spec.js.map