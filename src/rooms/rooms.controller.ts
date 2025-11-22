import {
  Body,
  Controller,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { RoomEntity } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';

@ApiBearerAuth()
@ApiTags('rooms')
@UseGuards(AuthGuard('jwt'))
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiCreatedResponse({
    type: RoomEntity,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request, @Body() body: CreateRoomDto): Promise<RoomEntity> {
    return this.roomsService.create(body, request.user);
  }

  @ApiCreatedResponse({
    type: RoomEntity,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, description: 'Room ID' })
  update(
    @Param('id') id: string,
    @Request() request,
    @Body() body: UpdateRoomDto,
  ): Promise<RoomEntity | null> {
    return this.roomsService.update(id, body, request.user.id);
  }

  @ApiCreatedResponse({
    type: PaginatedResponseDto<RoomEntity>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByHouse(
    @Request() request,
    @Query() query: GetRoomsDto,
  ): Promise<PaginatedResponseDto<RoomEntity>> {
    return this.roomsService.findByHouse(request.user.id, query);
  }

  @ApiCreatedResponse({
    type: PaginationInfoResponseDto,
  })
  @Get(':id/paging')
  @ApiParam({ name: 'id', type: String, description: 'The ID of the house' })
  @HttpCode(HttpStatus.OK)
  countByHouse(
    @Request() request,
    @Param() { id }: { id: string },
  ): Promise<PaginationInfoResponseDto> {
    return this.roomsService.countByHouse(request.user.id, id);
  }
}
