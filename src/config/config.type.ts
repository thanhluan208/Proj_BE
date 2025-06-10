import { DatabaseConfig } from 'src/database/config/database-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { AppConfig } from './app-config.type';
import { AuthConfig } from 'src/auth/config/auth-config.type';

export type AllConfigType = {
  database: DatabaseConfig;
  mail: MailConfig;
  app: AppConfig;
  auth: AuthConfig;
};
