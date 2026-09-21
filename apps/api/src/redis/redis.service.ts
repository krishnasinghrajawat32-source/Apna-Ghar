import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      this.isConnected = false;
      this.logger.log('[Redis] Test environment detected; skipping startup connection to keep e2e boot fast.');
      return;
    }

    const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('⚠️ Redis offline. Using in-memory fallback cache for development.');
            return null; // stop reconnecting
          }
          return Math.min(times * 200, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Redis connected successfully.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        // Suppress repeated spam, log once
      });
    } catch (err) {
      this.logger.warn(`Redis init error: ${err.message}. Using in-memory fallback.`);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed, fallback to memory: ${err.message}`);
      }
    }

    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number, flag?: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        if (mode === 'EX' && duration) {
          return await this.client.set(key, value, 'EX', duration);
        }
        if (mode === 'PX' && duration && flag === 'NX') {
          return await this.client.set(key, value, 'PX', duration, 'NX');
        }
        return await this.client.set(key, value);
      } catch (err) {
        this.logger.warn(`Redis set failed, fallback to memory: ${err.message}`);
      }
    }

    // In-memory fallback
    const ttlMs = mode === 'EX' && duration ? duration * 1000 : (mode === 'PX' && duration ? duration : undefined);
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;

    if (flag === 'NX' && this.inMemoryFallback.has(key)) {
      const existing = this.inMemoryFallback.get(key);
      if (!existing.expiresAt || existing.expiresAt > Date.now()) {
        return null; // Already exists
      }
    }

    this.inMemoryFallback.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Redis del failed: ${err.message}`);
      }
    }
    const existed = this.inMemoryFallback.has(key);
    this.inMemoryFallback.delete(key);
    return existed ? 1 : 0;
  }

  async isHealthy(): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        const res = await this.client.ping();
        return res === 'PONG';
      } catch {
        return false;
      }
    }
    return false;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
