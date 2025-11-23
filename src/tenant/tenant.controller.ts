import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GetTenantDto } from './dto/get-tenant.dto';
import { TenantService } from './tenant.service';
import { TenantEntity } from './tenant.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('tenant')
@UseGuards(AuthGuard('jwt'))
@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @ApiCreatedResponse({
    type: TenantEntity,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateTenantDto,
  ): Promise<TenantEntity> {
    return this.tenantService.create(body, request.user);
  }

  @ApiCreatedResponse({
    type: PaginatedResponseDto<TenantEntity>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByHouse(
    @Request() request,
    @Query() query: GetTenantDto,
  ): Promise<PaginatedResponseDto<TenantEntity>> {
    return this.tenantService.findByRoom(request.user.id, query);
  }

  @ApiCreatedResponse({
    type: PaginationInfoResponseDto,
  })
  @Get('paging')
  @HttpCode(HttpStatus.OK)
  countByHouse(
    @Request() request,
    @Query() query: GetTenantDto,
  ): Promise<PaginationInfoResponseDto> {
    return this.tenantService.countByRoom(request.user.id, query);
  }

  @ApiCreatedResponse({
    type: TenantEntity,
  })
  @Post(':id/upload-id-card')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.OK)
  uploadIdCard(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },
  ): Promise<TenantEntity> {
    return this.tenantService.uploadIdCard(id, files);
  }
}
