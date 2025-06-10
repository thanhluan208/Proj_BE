import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './database/config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import mailConfig from './mail/config/mail.config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { AllConfigType } from './config/config.type';
import path from 'path';
import { MailerModule } from './mailer/mailer.module';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import { UsersModule } from './users/users.module';
import { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { SessionModule } from './session/session.module';
import { UserProjectModule } from './user-project/user-project.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, mailConfig, authConfig, appConfig],
      envFilePath: '.env',
    }),

    // Database Module
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return {
          fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
            infer: true,
          }),
          loaderOptions: {
            path: path.join(__dirname, '/i18n/'),
            watch: true,
          },
        };
      },
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    SessionModule,
    AuthModule,
    MailModule,
    MailerModule,
    UserProjectModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
