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
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { HouseEntity } from './house.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { AUTH_CONSTANTS } from 'src/utils/constant';
import { OwnershipGuard } from 'src/auth/guards/ownership.guard';
import { CheckOwnershipDynamic } from 'src/auth/decorators/ownership.decorator';

@ApiBearerAuth()
@ApiTags('houses')
@UseGuards(AuthGuard(AUTH_CONSTANTS.jwt))
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
    type: HouseEntity,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'House ID' })
  update(
    @Param('id') id: string,
    @Body() body: CreateHouseDto,
    @Request() request,
  ): Promise<HouseEntity | null> {
    return this.housesService.update(id, body, request.user);
  }

  @ApiCreatedResponse({
    type: HouseEntity,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'House ID' })
  delete(
    @Param('id') id: string,
    @Request() request,
  ): Promise<HouseEntity | null> {
    return this.housesService.delete(id, request.user);
  }

  @ApiCreatedResponse({
    type: HouseEntity,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'House ID' })
  @CheckOwnershipDynamic({
    entity: HouseEntity,
    ownerField: 'owner',
    resourceIdParam: 'id',
  })
  findById(@Request() request): Promise<HouseEntity | null> {
    return this.housesService.findById(request.params.id, request.user.id);
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
  getPagingByUser(@Request() request): Promise<PaginationInfoResponseDto> {
    return this.housesService.countByUser(request.user.id);
  }
}
