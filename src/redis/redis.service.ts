import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/utils/constant';

/**
 * Redis Service
 * Provides high-level methods for Redis operations
 * Includes specific methods for OTP management and rate limiting
 *
 */

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  onModuleDestroy() {
    this.redis.quit();
  }

  /**
   * Set a key-value pair with optional expiration time
   * @param key - The key to set
   * @param value - The value to store
   * @param ttlSeconds - Time to live in seconds (optional)
   * @returns Promise<string> - 'OK' if successful
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    if (ttlSeconds) {
      return await this.redis.setex(key, ttlSeconds, value);
    }
    return await this.redis.set(key, value);
  }

  /**
   * Get value by key
   * @param key - The key to retrieve
   * @returns Promise<string | null> - The value or null if not found
   */
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  /**
   * Delete one or more keys
   * @param keys - Keys to delete
   * @returns Promise<number> - Number of keys deleted
   */
  async del(...keys: string[]): Promise<number> {
    return await this.redis.del(...keys);
  }

  /**
   * Check if key exists
   * @param key - The key to check
   * @returns Promise<boolean> - True if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key
   * @param key - The key to check
   * @returns Promise<number> - TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  /**
   * Increment a key's value
   * @param key - The key to increment
   * @returns Promise<number> - The new value after increment
   */
  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  /**
   * Set key expiration time
   * @param key - The key to set expiration for
   * @param seconds - Expiration time in seconds
   * @returns Promise<boolean> - True if expiration was set
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds);
    return result === 1;
  }

  // ========== UTILITY METHODS ==========

  /**
   * Health check method to verify Redis connection
   * @returns Promise<boolean> - True if Redis is connected
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get Redis client statistics
   * @returns Promise<object> - Redis connection info
   */
  async getInfo(): Promise<any> {
    try {
      return await this.redis.info();
    } catch (error) {
      console.error('Failed to get Redis info:', error);
      return null;
    }
  }
}
