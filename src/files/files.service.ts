import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'node:crypto';
import { FileRepository } from './file.repository';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { InjectMinio } from './decorator/minio.decorator';
import { FileEntity } from './file.entity';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'text/plain',
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    @InjectMinio()
    private readonly minioService: Minio.Client,
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async uploadFile(file: Express.Multer.File, ownerId?: string) {
    // Validate file
    this.validateFile(file);

    const fileId = randomUUID();
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
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
        uploadedAt: savedFile.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async getFile(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException('FileEntity not found');
    }
    return file;
  }

  async getFilesByOwner(ownerId: string) {
    return this.fileRepository.findByOwner(ownerId);
  }

  async deleteFile(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException('FileEntity not found');
    }

    const bucketname = this.configService.getOrThrow('minio.bucketName', {
      infer: true,
    });

    try {
      // Delete from MinIO
      await this.minioService.removeObject(bucketname, file.path);

      // Delete from database
      await this.fileRepository.delete(id);

      return { message: 'FileEntity deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileStream(id: string) {
    const file = await this.getFile(id);
    const bucketname = this.configService.getOrThrow('minio.bucketName', {
      infer: true,
    });

    try {
      const stream = await this.minioService.getObject(bucketname, file.path);
      return { stream, file };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve file: ${error.message}`,
      );
    }
  }

  async getFileBuffer(
    id: string,
  ): Promise<{ buffer: Buffer; file: FileEntity }> {
    const file = await this.getFile(id);
    const bucketname = this.configService.getOrThrow('minio.bucketName', {
      infer: true,
    });

    try {
      const stream = await this.minioService.getObject(bucketname, file.path);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, file });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve file: ${error.message}`,
      );
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `FileEntity size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `FileEntity type ${file.mimetype} is not allowed`,
      );
    }
  }

  private getFileExtension(filename: string): string {
    const ext = path.extname(filename);
    return ext || '.bin'; // Default extension if none found
  }
}
