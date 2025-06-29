import { registerAs } from '@nestjs/config';

import {
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MinioConfig } from './minio-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  MINIO_ENDPOINT: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  MINIO_PORT: number;

  @IsBoolean()
  MINIO_USE_SSL: boolean;

  @IsString()
  MINIO_ACCESS_KEY: string;

  @IsString()
  MINIO_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  MINIO_BUCKET_NAME: string;

  @IsString()
  @IsOptional()
  MINIO_REGION: string;

  @IsBoolean()
  @IsOptional()
  MINIO_PATH_STYLE: boolean;

  @IsInt()
  @IsOptional()
  @Min(1000)
  @Max(60000)
  MINIO_CONNECT_TIMEOUT: number;

  @IsInt()
  @IsOptional()
  @Min(1000)
  @Max(60000)
  MINIO_READ_TIMEOUT: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  MINIO_MAX_RETRIES: number;

  @IsInt()
  @IsOptional()
  @Min(100)
  @Max(10000)
  MINIO_RETRY_DELAY: number;
}

export default registerAs<MinioConfig>('minio', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    endpoint: process.env.MINIO_ENDPOINT!,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
    bucketName: process.env.MINIO_BUCKET || 'bucket-name',
    region: process.env.MINIO_REGION,
    pathStyle: process.env.MINIO_PATH_STYLE === 'true',
    connectTimeout: process.env.MINIO_CONNECT_TIMEOUT
      ? parseInt(process.env.MINIO_CONNECT_TIMEOUT, 10)
      : 10000,
    readTimeout: process.env.MINIO_READ_TIMEOUT
      ? parseInt(process.env.MINIO_READ_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.MINIO_MAX_RETRIES
      ? parseInt(process.env.MINIO_MAX_RETRIES, 10)
      : 3,
    retryDelay: process.env.MINIO_RETRY_DELAY
      ? parseInt(process.env.MINIO_RETRY_DELAY, 10)
      : 1000,
  };
});
