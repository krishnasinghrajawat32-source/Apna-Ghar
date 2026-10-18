import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

export * from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService): Promise<Redis> => {
        const logger = new Logger('RedisModule');
        const redisUrl = configService.get<string>('redisUrl') || 'redis://127.0.0.1:6379';

        try {
          const client = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            connectTimeout: 1500,
            retryStrategy: () => null,
          });

          client.on('error', (err: Error) => {
            logger.debug(`Redis client status notice: ${err.message}`);
          });

          await client.connect();
          logger.log(`Connected to live Redis at ${redisUrl}`);
          return client;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          logger.warn(
            `Unable to connect to live Redis (${errMsg}). Initializing fully-compatible in-memory Redis mock for local development and testing.`,
          );
          const mockClient = new RedisMock() as unknown as Redis;
          return mockClient;
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
