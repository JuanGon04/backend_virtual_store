// redis.service.ts
import { envs } from '@common/config';
import { logger } from '@common/utils';
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private client: Redis;

  async onModuleInit() {
    this.client = new Redis({
      host: envs.redis_host,
      port: envs.redis_port,
    });

    this.client.on('connect', () => {
      logger('RedisCacheServices', 'Redis server connected', null, 'log');
    });

    this.client.on('error', (err) => {
      logger(
        'RedisCacheServices',
        'Redis server connected faild',
        err,
        'error',
      );
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  async set(key: string, value: any, ttl = 86400) {
    return this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async getAllKeys(pattern = '*') {
    return this.client.keys(pattern);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.getAllKeys(pattern);

    for (const key of keys) {
      await this.client.del(key);
    }
  }
}
