import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import { AllConfigType } from './config/config.type';
import databaseConfig from './database/config/database.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { FilesModule } from './files/files.module';
import minioConfig from './files/config/minio.config';
import { HealthController } from './health/health.controller';
import { HousesModule } from './houses/house.module';
import mailConfig from './mail/config/mail.config';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';
import { RoomModule } from './rooms/room.module';
import { SessionModule } from './session/session.module';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, mailConfig, authConfig, appConfig, minioConfig],
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

    HousesModule,
    RoomModule,
    TenantModule,
    FilesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
