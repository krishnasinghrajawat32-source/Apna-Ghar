import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { getConnectionToken } from '@nestjs/mongoose';
import { RedisService } from '../../redis/redis.service';

describe('HealthController', () => {
  let healthController: HealthController;

  const mockMongoConnection = {
    readyState: 1, // 1 = connected
  };

  const mockRedisService = {
    ping: jest.fn().mockResolvedValue('PONG'),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: mockMongoConnection,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    healthController = moduleRef.get<HealthController>(HealthController);
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
