import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import { ContractsModule } from './contracts/contracts.module';
import { AllConfigType } from './config/config.type';
import { BillingModule } from './billing/billing.module';
import { VisionModule } from './vision/vision.module';
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
import { HouseExpensesModule } from './house-expenses/house-expenses.module';
import { RoomExpensesModule } from './room-expenses/room-expenses.module';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';
import redisConfig from './redis/config/redis.config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        mailConfig,
        authConfig,
        appConfig,
        minioConfig,
        redisConfig,
      ],
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

    RedisModule,
    UsersModule,
    SessionModule,
    AuthModule,
    MailModule,
    MailerModule,

    HousesModule,
    RoomModule,
    TenantModule,
    FilesModule,
    HouseExpensesModule,
    RoomExpensesModule,
    BillingModule,
    ContractsModule,
    VisionModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
