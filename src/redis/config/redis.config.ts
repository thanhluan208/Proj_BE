import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';

/**
 * Redis configuration validation class
 * Ensures all Redis connection parameters are properly validated
 */
class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB: number;

  @IsInt()
  @Min(50)
  @Max(10000)
  @IsOptional()
  REDIS_RETRY_DELAY_ON_FAILOVER: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  REDIS_MAX_RETRIES_PER_REQUEST: number;

  @IsInt()
  @Min(1000)
  @Max(60000)
  @IsOptional()
  REDIS_CONNECT_TIMEOUT: number;

  @IsInt()
  @Min(1000)
  @Max(30000)
  @IsOptional()
  REDIS_COMMAND_TIMEOUT: number;

  @IsInt()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  REDIS_KEEP_ALIVE: number;

  @IsInt()
  @Min(4)
  @Max(6)
  @IsOptional()
  REDIS_FAMILY: number;

  @IsBoolean()
  @IsOptional()
  REDIS_ENABLE_OFFLINE_QUEUE: boolean;

  @IsString()
  @IsOptional()
  REDIS_CONNECTION_NAME: string;
}

/**
 * Redis configuration factory
 * Provides Redis connection options with environment variable validation
 * All values are configurable through environment variables
 */
export default registerAs<RedisOptions>('redis', () => {
  // Validate environment variables before creating configuration
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),

    // Connection retry configuration - all configurable
    retryDelayOnFailover: parseInt(
      process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '100',
      10,
    ),
    maxRetriesPerRequest: parseInt(
      process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3',
      10,
    ),

    // Timeout configurations - all configurable
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),

    // Keep alive settings for stable connection - configurable
    keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),

    // Family preference (IPv4/IPv6) - configurable
    family: parseInt(process.env.REDIS_FAMILY || '4', 10),

    // Enable offline queue to handle commands when disconnected - configurable
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',

    // Connection name for easier debugging - configurable
    connectionName:
      process.env.REDIS_CONNECTION_NAME || 'nestjs-property-management',
  };
});
