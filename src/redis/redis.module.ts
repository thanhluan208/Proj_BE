import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisOptions } from 'ioredis/built/cluster/util';
import { AllConfigType } from '../config/config.type';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from 'src/utils/constant';

/**
 * Redis client provider factory
 * Creates and configures Redis client instance with proper error handling
 */
const redisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService<AllConfigType>) => {
    // Get Redis configuration from config service
    const redisConfig = configService.get('redis', { infer: true });

    // Create new Redis instance with configuration
    const redis = new Redis(redisConfig as RedisOptions);

    return redis;
  },
  inject: [ConfigService],
};

/**
 * Global Redis Module
 * Provides Redis client instance and RedisService throughout the application
 * Configured as global module to avoid importing in every feature module
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisClientProvider, RedisService],
  exports: [redisClientProvider, RedisService],
})
export class RedisModule {}
