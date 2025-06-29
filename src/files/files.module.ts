import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileRepository } from './file.repository';
import { File } from './file.entity';
import { ConfigService } from '@nestjs/config';
import { MINIO_TOKEN } from './decorator/minio.decorator';
import { AllConfigType } from 'src/config/config.type';
import * as Minio from 'minio';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileRepository,
    {
      inject: [ConfigService],
      provide: MINIO_TOKEN,
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const client = new Minio.Client({
          endPoint: configService.getOrThrow('minio.endpoint', {
            infer: true,
          }),
          port: +configService.getOrThrow('minio.port', {
            infer: true,
          }),
          accessKey: configService.getOrThrow('minio.accessKey', {
            infer: true,
          }),
          secretKey: configService.getOrThrow('minio.secretKey', {
            infer: true,
          }),
          useSSL: false,
        });
        return client;
      },
    },
  ],
  exports: [FilesService, FileRepository],
})
export class FilesModule {}
