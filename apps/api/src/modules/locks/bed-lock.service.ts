import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class BedLockService {
  private readonly logger = new Logger(BedLockService.name);
  private readonly HOLD_TTL_SECONDS = 900; // 15 minutes default
  private readonly MUTEX_TTL_MS = 5000; // 5 seconds mutex

  constructor(private readonly redisService: RedisService) {}

  /**
   * Acquires a transient distributed mutex on the bed to serialize execution
   */
  async acquireMutex(bedId: string, ttlMs = this.MUTEX_TTL_MS): Promise<boolean> {
    const key = `lock:bed:${bedId}`;
    const acquired = await this.redisService.set(key, '1', 'PX', ttlMs, 'NX');
    return acquired !== null && acquired !== undefined;
  }

  /**
   * Releases transient mutex on the bed
   */
  async releaseMutex(bedId: string): Promise<void> {
    const key = `lock:bed:${bedId}`;
    await this.redisService.del(key);
  }

  /**
   * Sets a 15-minute hold in Redis for the given student
   */
  async setBedHold(bedId: string, studentId: string, ttlSeconds = this.HOLD_TTL_SECONDS): Promise<void> {
    const key = `hold:bed:${bedId}`;
    await this.redisService.set(key, studentId, 'EX', ttlSeconds);
    this.logger.log(`Bed hold set for bedId=${bedId} studentId=${studentId} for ${ttlSeconds}s`);
  }

  /**
   * Reads currently active Redis hold
   */
  async getBedHold(bedId: string): Promise<string | null> {
    const key = `hold:bed:${bedId}`;
    return await this.redisService.get(key);
  }

  /**
   * Deletes Redis hold
   */
  async releaseBedHold(bedId: string): Promise<void> {
    const key = `hold:bed:${bedId}`;
    await this.redisService.del(key);
    this.logger.log(`Bed hold released for bedId=${bedId}`);
  }
}
