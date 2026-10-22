import { Connection } from 'mongoose';
import { HealthCheckResponse } from '@apna-ghar/shared-types';
import { RedisService } from '../../redis/redis.service';
export declare class HealthController {
    private readonly mongoConnection;
    private readonly redisService;
    private readonly startTime;
    constructor(mongoConnection: Connection, redisService: RedisService);
    check(): Promise<HealthCheckResponse>;
}
//# sourceMappingURL=health.controller.d.ts.map