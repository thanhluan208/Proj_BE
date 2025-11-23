import { DatabaseConfig } from 'src/database/config/database-config.type';
import { MailConfig } from 'src/mail/config/mail-config.type';
import { AppConfig } from './app-config.type';
import { AuthConfig } from 'src/auth/config/auth-config.type';
import { MinioConfig } from 'src/files/config/minio-config.type';
import { RedisConfigType } from 'src/redis/config/redis-config.type';
import { GeminiConfig } from 'src/vision/config/gemini-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  mail: MailConfig;
  minio: MinioConfig;
  gemini: GeminiConfig;
  redis: RedisConfigType;
};
