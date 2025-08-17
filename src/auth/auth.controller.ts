import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/types/common.type';
import { AuthService } from './auth.service';
import { ConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_CONSTANTS } from 'src/utils/constant';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    return this.authService.validateLogin(loginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() dto: AuthRegisterLoginDto,
  ): Promise<CommonResponse<null>> {
    return this.authService.register(dto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(
    @Body() confirmEmailDto: ConfirmEmailDto,
  ): Promise<CommonResponse<null>> {
    return this.authService.confirmEmailWithOtp(
      confirmEmailDto.email,
      confirmEmailDto.otpCode,
    );
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Refreshes the JWT token',
  })
  @UseGuards(AuthGuard(AUTH_CONSTANTS.jwtRefresh))
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Request() req: { user: JwtRefreshPayloadType },
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    console.log('Refresh token called for user:', req.user);
    return this.authService.refreshToken({
      hash: req.user.hash,
      sessionId: req.user.sessionId,
    });
  }
}
