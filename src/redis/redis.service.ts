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

  // ========== OTP SPECIFIC METHODS ==========

  /**
   * Store OTP code for email confirmation
   * @param email - User's email address
   * @param otp - 6-digit OTP code
   * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  async setOTP(
    email: string,
    otp: string,
    ttlSeconds: number = 300, // 5 minutes default
  ): Promise<void> {
    const key = this.getOTPKey(email);
    await this.set(key, otp, ttlSeconds);
  }

  /**
   * Get OTP code for email confirmation
   * @param email - User's email address
   * @returns Promise<string | null> - The OTP code or null if not found/expired
   */
  async getOTP(email: string): Promise<string | null> {
    const key = this.getOTPKey(email);
    return await this.get(key);
  }

  /**
   * Delete OTP code after successful verification
   * @param email - User's email address
   */
  async deleteOTP(email: string): Promise<void> {
    const key = this.getOTPKey(email);
    await this.del(key);
  }

  /**
   * Check if OTP exists and is valid
   * @param email - User's email address
   * @param otp - OTP code to verify
   * @returns Promise<boolean> - True if OTP is valid
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOTP = await this.getOTP(email);
    return storedOTP === otp;
  }

  // ========== RATE LIMITING METHODS ==========

  /**
   * Get current attempt count for resend OTP
   * @param email - User's email address
   * @returns Promise<number> - Current attempt count
   */
  async getResendAttempts(email: string): Promise<number> {
    const key = this.getResendAttemptsKey(email);
    const attempts = await this.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  /**
   * Increment resend attempt count
   * @param email - User's email address
   * @param ttlSeconds - Time to live for the counter
   * @returns Promise<number> - New attempt count
   */
  async incrementResendAttempts(
    email: string,
    ttlSeconds: number = 300, // 5 minutes default
  ): Promise<number> {
    const key = this.getResendAttemptsKey(email);
    const newCount = await this.incr(key);

    // Set expiration only for the first attempt
    if (newCount === 1) {
      await this.expire(key, ttlSeconds);
    }

    return newCount;
  }

  /**
   * Set cooldown period for resend requests
   * @param email - User's email address
   * @param cooldownSeconds - Cooldown period in seconds
   */
  async setResendCooldown(
    email: string,
    cooldownSeconds: number,
  ): Promise<void> {
    const key = this.getResendCooldownKey(email);
    await this.set(key, 'cooldown', cooldownSeconds);
  }

  /**
   * Check if user is in cooldown period
   * @param email - User's email address
   * @returns Promise<number> - Remaining cooldown time in seconds, 0 if no cooldown
   */
  async getResendCooldown(email: string): Promise<number> {
    const key = this.getResendCooldownKey(email);
    const ttl = await this.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Reset resend attempts and cooldown
   * @param email - User's email address
   */
  async resetResendLimits(email: string): Promise<void> {
    const attemptsKey = this.getResendAttemptsKey(email);
    const cooldownKey = this.getResendCooldownKey(email);
    await this.del(attemptsKey, cooldownKey);
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Generate Redis key for OTP storage
   * @param email - User's email address
   * @returns string - Redis key for OTP
   */
  private getOTPKey(email: string): string {
    return `otp:${email}`;
  }

  /**
   * Generate Redis key for resend attempts tracking
   * @param email - User's email address
   * @returns string - Redis key for resend attempts
   */
  private getResendAttemptsKey(email: string): string {
    return `resend_attempts:${email}`;
  }

  /**
   * Generate Redis key for resend cooldown tracking
   * @param email - User's email address
   * @returns string - Redis key for resend cooldown
   */
  private getResendCooldownKey(email: string): string {
    return `resend_cooldown:${email}`;
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
