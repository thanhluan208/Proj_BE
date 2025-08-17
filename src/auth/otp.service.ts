import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { RedisService } from '../redis/redis.service';
import { randomInt } from 'crypto';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';

/**
 * OTP (One-Time Password) Service
 * Handles generation, storage, and validation of OTP codes for email confirmation
 * Implements rate limiting and cooldown mechanisms for security
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /**
   * Generate a 6-digit OTP code
   * Uses cryptographically secure random number generation
   * @returns string - 6-digit OTP code
   */
  generateOtpCode(): string {
    // Generate random integer between 100000 and 999999 (inclusive)
    const otp = randomInt(100000, 1000000).toString();

    // Mask OTP in logs (only show first 2 digits)
    this.logger.debug(`Generated OTP code: ${otp.substring(0, 2)}****`);

    return otp;
  }

  /**
   * Store OTP code in Redis with expiration
   * @param email - User's email address
   * @param otpCode - 6-digit OTP code
   * @returns Promise<void>
   */
  async storeOtp(email: string, otpCode: string): Promise<void> {
    const otpExpiryMinutes =
      this.configService.get('app.otpExpiryMinutes', {
        infer: true,
      }) || 5;

    const ttlSeconds = otpExpiryMinutes * 60; // Convert minutes to seconds

    await this.redisService.set(
      `${REDIS_PREFIX_KEY.otp}${email}`,
      otpCode,
      ttlSeconds,
    );
    this.logger.log(
      `OTP stored for email: ${email} with expiry: ${otpExpiryMinutes} minutes`,
    );
  }

  /**
   * Verify OTP code against stored value
   * @param email - User's email address
   * @param providedOtp - OTP code provided by user
   * @returns Promise<boolean> - True if OTP is valid
   */
  async verifyOtp(email: string, providedOtp: string): Promise<boolean> {
    const storedOtp = await this.redisService.get(
      `${REDIS_PREFIX_KEY.otp}${email}`,
    );

    if (!storedOtp) {
      this.logger.warn(
        `OTP verification failed - No OTP found for email: ${email}`,
      );
      return false;
    }

    const isValid = storedOtp === providedOtp;

    if (isValid) {
      this.logger.log(`OTP verification successful for email: ${email}`);
      // Delete OTP after successful verification to prevent reuse
      await this.redisService.del(`${REDIS_PREFIX_KEY.otp}${email}`);
    } else {
      this.logger.warn(
        `OTP verification failed - Invalid OTP for email: ${email}`,
      );
    }

    return isValid;
  }

  /**
   * Check if user can resend OTP (rate limiting)
   * @param email - User's email address
   * @returns Promise<{canResend: boolean, waitTime: number, attemptsLeft: number}>
   */
  async canResendOtp(email: string): Promise<{
    canResend: boolean;
    waitTime: number;
    attemptsLeft: number;
  }> {
    // Check if user is in cooldown period
    const cooldownTime = await this.getResendCooldown(email);
    if (cooldownTime > 0) {
      this.logger.warn(
        `Resend blocked - User in cooldown for ${cooldownTime}s: ${email}`,
      );
      return {
        canResend: false,
        waitTime: cooldownTime,
        attemptsLeft: 0,
      };
    }

    // Check current attempt count
    const currentAttempts = await this.getResendAttempts(email);
    const maxAttempts =
      this.configService.get('app.otpResendLimit', {
        infer: true,
      }) || 3;

    const attemptsLeft = Math.max(0, maxAttempts - currentAttempts);

    if (currentAttempts >= maxAttempts) {
      // Calculate exponential backoff cooldown
      const baseCooldownMinutes =
        this.configService.get('app.otpResendCooldownMinutes', {
          infer: true,
        }) || 5;

      const cooldownSeconds =
        Math.pow(2, currentAttempts - maxAttempts) * baseCooldownMinutes * 60;
      const maxCooldownMinutes =
        this.configService.get('app.otpMaxCooldownMinutes', {
          infer: true,
        }) || 60;

      // Cap the cooldown to maximum allowed time
      const cappedCooldownSeconds = Math.min(
        cooldownSeconds,
        maxCooldownMinutes * 60,
      );

      await this.setResendCooldown(email, cappedCooldownSeconds);

      this.logger.warn(
        `Resend limit exceeded for email: ${email}, cooldown set for ${cappedCooldownSeconds}s`,
      );

      return {
        canResend: false,
        waitTime: cappedCooldownSeconds,
        attemptsLeft: 0,
      };
    }

    return {
      canResend: true,
      waitTime: 0,
      attemptsLeft,
    };
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
    const key = `${REDIS_PREFIX_KEY.resendAttempts}${email}`;
    const newCount = await this.redisService.incr(key);

    // Set expiration only for the first attempt
    if (newCount === 1) {
      await this.redisService.expire(key, ttlSeconds);
    }

    return newCount;
  }

  /**
   * Reset all OTP-related data for a user (after successful confirmation)
   * @param email - User's email address
   */
  async resetOtpData(email: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`${REDIS_PREFIX_KEY.otp}${email}`),
      this.resetResendLimits(email),
    ]);

    this.logger.log(`OTP data reset for email: ${email}`);
  }

  /**
   * Get OTP statistics for monitoring/debugging
   * @param email - User's email address
   * @returns Promise<object> - OTP statistics
   */
  async getOtpStats(email: string): Promise<{
    hasOtp: boolean;
    otpTtl: number;
    resendAttempts: number;
    cooldownTtl: number;
  }> {
    const [hasOtp, otpTtl, resendAttempts, cooldownTtl] = await Promise.all([
      this.redisService.exists(`otp:${email}`),
      this.redisService.ttl(`otp:${email}`),
      this.getResendAttempts(email),
      this.getResendCooldown(email),
    ]);

    return {
      hasOtp,
      otpTtl: Math.max(0, otpTtl),
      resendAttempts,
      cooldownTtl: Math.max(0, cooldownTtl),
    };
  }

  /**
   * Get current attempt count for resend OTP
   * @param email - User's email address
   * @returns Promise<number> - Current attempt count
   */
  async getResendAttempts(email: string): Promise<number> {
    const key = `${REDIS_PREFIX_KEY.resendAttempts}${email}`;
    const attempts = await this.redisService.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
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
    await this.redisService.set(
      `${REDIS_PREFIX_KEY.resendCooldown}${email}`,
      'cooldown',
      cooldownSeconds,
    );
  }

  /**
   * Check if user is in cooldown period
   * @param email - User's email address
   * @returns Promise<number> - Remaining cooldown time in seconds, 0 if no cooldown
   */
  async getResendCooldown(email: string): Promise<number> {
    const key = `${REDIS_PREFIX_KEY.resendCooldown}${email}`;
    const ttl = await this.redisService.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Reset resend attempts and cooldown
   * @param email - User's email address
   */
  async resetResendLimits(email: string): Promise<void> {
    const attemptsKey = `${REDIS_PREFIX_KEY.resendAttempts}${email}`;
    const cooldownKey = `${REDIS_PREFIX_KEY.resendCooldown}${email}`;
    await this.redisService.del(attemptsKey, cooldownKey);
  }
}
