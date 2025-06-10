import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { AuthRegisterLoginDto } from './dto/auth-register.dto';
import { AuthService } from './auth.service';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    return this.authService.validateLogin(loginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: AuthRegisterLoginDto): Promise<void> {
    return this.authService.register(dto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.authService.confirmEmail(confirmEmailDto.hash);
  }
}
