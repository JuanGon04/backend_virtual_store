import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './cache-redis.service';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheRedisModule {}
