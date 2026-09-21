import { Module } from '@nestjs/common';
import { BedLockService } from './bed-lock.service';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [BedLockService],
  exports: [BedLockService],
})
export class LocksModule {}
