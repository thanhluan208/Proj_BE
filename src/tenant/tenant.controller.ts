import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Headers as NestHeaders,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GetTenantDto } from './dto/get-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantEntity } from './tenant.entity';
import { TenantService } from './tenant.service';

@ApiBearerAuth()
@ApiTags('tenant')
@UseGuards(AuthGuard('jwt'))
@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @ApiCreatedResponse({
    type: TenantEntity,
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateTenantDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<TenantEntity> {
    return this.tenantService.create(body, request.user, timezone);
  }

  @ApiCreatedResponse({
    type: PaginatedResponseDto<TenantEntity>,
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByHouse(
    @Request() request,
    @Query() query: GetTenantDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<PaginatedResponseDto<TenantEntity>> {
    return this.tenantService.findByRoom(request.user.id, query, timezone);
  }

  @ApiCreatedResponse({
    type: PaginationInfoResponseDto,
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Get('paging')
  @HttpCode(HttpStatus.OK)
  countByHouse(
    @Request() request,
    @Query() query: GetTenantDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<PaginationInfoResponseDto> {
    return this.tenantService.countByRoom(request.user.id, query, timezone);
  }

  @ApiCreatedResponse({
    type: TenantEntity,
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<TenantEntity> {
    return this.tenantService.update(id, body, request.user, timezone);
  }

  @ApiTags('Tenants')
  @ApiCreatedResponse({
    description: 'Upload tenant ID card images (front and/or back)',
    type: TenantEntity,
  })
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Post(':roomId/upload-id-card')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'roomId',
    type: String,
    required: true,
    description: 'Room ID where the tenant belongs',
  })
  @ApiBody({
    description: 'Tenant ID (optional) and ID card images',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          nullable: true,
          description: 'Existing tenant ID (omit to create new tenant)',
          example: 'c4c4d5a1-7b02-4d23-a6f9-xxxx',
        },
        frontImage: {
          type: 'string',
          format: 'binary',
          description: 'Front side of citizen ID card',
        },
        backImage: {
          type: 'string',
          format: 'binary',
          description: 'Back side of citizen ID card',
        },
      },
      required: [],
    },
  })
  uploadIdCard(
    @Param('roomId') roomId: string,

    @Body()
    body: {
      id?: string;
    },

    @UploadedFiles()
    files: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },

    @Req() request: any,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<TenantEntity> {
    return this.tenantService.uploadIdCard(
      roomId,
      {
        frontImage: files.frontImage?.[0],
        backImage: files.backImage?.[0],
      },
      request.user,
      body.id,
      timezone,
    );
  }

  @ApiCreatedResponse({
    type: TenantEntity,
  })
  @Post(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  toggleStatus(
    @Request() request,
    @Param('id') id: string,
  ): Promise<TenantEntity> {
    return this.tenantService.toggleStatus(id, request.user);
  }

  @ApiCreatedResponse({
    type: Object,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(
    @Request() request,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.tenantService.delete(id, request.user);
  }

  @ApiOkResponse({
    description: 'Download both front and back ID card images as a zip file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Tenant ID',
  })
  @Get(':id/download-id-cards')
  @HttpCode(HttpStatus.OK)
  async downloadIdCards(
    @Request() request,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, filename } = await this.tenantService.downloadIdCards(
      id,
      request.user,
    );

    // Use RFC 5987 encoding for international characters
    const encodedFilename = encodeURIComponent(filename);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    });

    return new StreamableFile(stream);
  }
}
