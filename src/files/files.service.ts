import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'node:crypto';
import { FileRepository } from './file.repository';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { InjectMinio } from './decorator/minio.decorator';
import { FileEntity } from './file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectMinio()
    private readonly minioService: Minio.Client,
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async uploadFile(file: Express.Multer.File, ownerId?: string) {
    const fileId = randomUUID();
    const fileName = `${fileId}.${file.originalname.split('.').pop()}`;
    const bucketname = this.configService.getOrThrow('minio.bucketName', {
      infer: true,
    });

    try {
      // Upload to MinIO
      await this.minioService.putObject(
        bucketname,
        fileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // Save file metadata to database
      const fileData: Partial<FileEntity> = {
        id: fileId,
        path: fileName,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        owner: ownerId ? ({ id: ownerId } as any) : undefined,
      };

      const savedFile = await this.fileRepository.create(fileData);

      return {
        id: savedFile.id,
        path: savedFile.path,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        originalName: savedFile.originalName,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFile(id: string) {
    return this.fileRepository.findById(id);
  }

  async getFilesByOwner(ownerId: string) {
    return this.fileRepository.findByOwner(ownerId);
  }

  async deleteFile(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new Error('File not found');
    }

    const bucketname = this.configService.getOrThrow('minio.bucketName', {
      infer: true,
    });

    try {
      // Delete from MinIO
      await this.minioService.removeObject(bucketname, file.path);

      // Delete from database
      await this.fileRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
