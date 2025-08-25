import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './users.service';
import { UserEntity } from './user.entity';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiCreatedResponse({
    type: UserEntity,
  })
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  findProfile(@Request() request): Promise<UserEntity | null> {
    return this.userService.findById(request.user.id);
  }
}
