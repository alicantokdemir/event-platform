import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class Cache {
  private redis: Redis;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required');
    this.redis = new Redis(url, { maxRetriesPerRequest: 2 });
  }

  async getJson<T>(key: string): Promise<T | null> {
    const v = await this.redis.get(key);
    return v ? (JSON.parse(v) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
}
