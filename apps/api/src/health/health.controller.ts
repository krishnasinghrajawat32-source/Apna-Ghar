import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MongoDbService } from '../common/database/mongodb.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mongoDb: MongoDbService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System and Infrastructure Health Check' })
  @ApiResponse({ status: 200, description: 'Health status report' })
  async checkHealth() {
    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `offline / fallback: ${err?.message?.split('\n')[0] || 'not reachable'}`;
    }

    const redisHealthy = await this.redis.isHealthy();
    const mongoConnected = this.mongoDb.isConnected();

    return {
      status: 'ok',
      service: 'Apna Ghar Core API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      databases: {
        mongoDb: {
          status: mongoConnected ? 'connected' : 'disconnected',
          host: '127.0.0.1:27017',
          database: 'apnaghar',
        },
        postgres: dbStatus,
      },
      dependencies: {
        database: dbStatus === 'healthy' ? 'healthy' : `degraded (${dbStatus})`,
        redis: redisHealthy ? 'healthy' : 'degraded (using in-memory fallback)',
      },
    };
  }
}
