import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { HouseEntity } from './house.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('houses')
@UseGuards(AuthGuard('jwt'))
@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @ApiCreatedResponse({
    type: HouseEntity,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateHouseDto,
  ): Promise<HouseEntity> {
    return this.housesService.create(body, request.user);
  }

  @ApiCreatedResponse({
    type: PaginatedResponseDto<HouseEntity>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByUser(
    @Request() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<HouseEntity>> {
    return this.housesService.findByUser(request.user.id, paginationDto);
  }

  @ApiCreatedResponse({
    type: PaginationInfoResponseDto,
  })
  @Get('paging')
  @HttpCode(HttpStatus.OK)
  getPagingByUser(
    @Request() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationInfoResponseDto> {
    return this.housesService.countByUser(request.user.id, paginationDto);
  }
}
