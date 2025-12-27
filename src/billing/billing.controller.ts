import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Headers as NestHeaders,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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
import type { Response } from 'express';
import * as multer from 'multer';
import { FilesService } from 'src/files/files.service';
import { AUTH_CONSTANTS } from 'src/utils/constant';
import { PaginatedResponseDto } from 'src/utils/dto/paginated-response.dto';
import { BillingEntity } from './billing.entity';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { GetBillingDto } from './dto/get-billing.dto';
import { PayBillingDto } from './dto/pay-billing.dto';

@ApiBearerAuth()
@ApiTags('billing')
@UseGuards(AuthGuard(AUTH_CONSTANTS.jwt))
@Controller('billing')
export class BillingController {
  constructor(
    private readonly service: BillingService,
    private readonly minioService: FilesService,
  ) {}

  @ApiCreatedResponse({
    type: BillingEntity,
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
    @Body() body: CreateBillingDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<BillingEntity> {
    return this.service.create(body, request.user, timezone);
  }

  @ApiOkResponse({
    type: PaginatedResponseDto<BillingEntity>,
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
    @Query() query: GetBillingDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<PaginatedResponseDto<BillingEntity>> {
    return this.service.getBillsByRoom(query, request.user, timezone);
  }

  @ApiOkResponse({
    type: PaginatedResponseDto<BillingEntity>,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Billing ID' })
  delete(@Request() request, @Param('id') id: string): Promise<BillingEntity> {
    return this.service.delete(id, request.user);
  }

  @ApiOkResponse({
    type: PaginatedResponseDto<BillingEntity>,
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Billing ID' })
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() body: CreateBillingDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<BillingEntity> {
    return this.service.update(id, body, request.user, timezone);
  }

  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
      },
    },
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Get('paging')
  @HttpCode(HttpStatus.OK)
  getTotalByHouse(
    @Request() request,
    @Query() query: GetBillingDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<{ total: number }> {
    return this.service.getTotalBillByRoom(query, request.user, timezone);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiBody({
    description: 'Pay billing with proof of payment',
    schema: {
      type: 'object',
      properties: {
        paymentDate: {
          type: 'string',
          format: 'date-time',
          description: 'Payment date',
          example: '2024-01-15T10:30:00Z',
        },
        proof: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof image or PDF (max 5MB)',
        },
      },
      required: ['paymentDate'],
    },
  })
  pay(
    @Request() request,
    @Param('id') id: string,
    @Body() body: PayBillingDto,
    @NestHeaders('x-timezone') timezone?: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({
          fileIsRequired: false,
        }),
    )
    proof?: Express.Multer.File,
  ) {
    return this.service.pay(id, body, request.user, timezone, proof);
  }

  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
  async download(
    @Request() request,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, file } = await this.service.download(id, request.user);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });

    return new StreamableFile(stream);
  }

  @Get(':id/download-proof')
  @HttpCode(HttpStatus.OK)
  async downloadProof(
    @Request() request,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, file } = await this.service.downloadProof(id, request.user);

    console.log('Downloading proof:', {
      fileName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
    });

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });

    return new StreamableFile(stream, {
      type: file.mimeType,
      disposition: `attachment; filename="${file.originalName}"`,
      length: file.size,
    });
  }
}
