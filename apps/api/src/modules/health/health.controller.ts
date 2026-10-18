import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { HealthCheckResponse } from '@apna-ghar/shared-types';
import { RedisService } from '../../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness & Readiness probe for MongoDB and Redis' })
  @SwaggerResponse({ status: 200, description: 'Health status check response' })
  async check(): Promise<HealthCheckResponse> {
    // Check MongoDB: 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
    const isMongoConnected = this.mongoConnection.readyState === 1;

    // Check Redis: ping() responds with 'PONG'
    let isRedisOk = false;
    try {
      const pingRes = await this.redisService.ping();
      isRedisOk = pingRes === 'PONG';
    } catch {
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
}
