import { DatabaseConfig } from 'src/database/config/database-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { AppConfig } from './app-config.type';
import { AuthConfig } from 'src/auth/config/auth-config.type';
import { MinioConfig } from 'src/files/config/minio-config.type';
import { RedisConfigType } from 'src/redis/config/redis-config.type';

export type AllConfigType = {
  database: DatabaseConfig;
  mail: MailConfig;
  app: AppConfig;
  auth: AuthConfig;
  minio: MinioConfig;
  redis: RedisConfigType;
};
