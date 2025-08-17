import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ms from 'ms';
import { AllConfigType } from 'src/config/config.type';
import { MailService } from 'src/mail/mail.service';
import { RoleEnum } from 'src/roles/roles.enum';
import { SessionEntity } from 'src/session/session.entity';
import { SessionService } from 'src/session/session.service';
import { StatusEntity } from 'src/statuses/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { UserEntity } from 'src/users/user.entity';
import { UserService } from 'src/users/users.service';
import { CommonResponse } from 'src/utils/types/common.type';
import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { OtpService } from './otp.service';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailService: MailService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    const user = await this.usersService.findByEmail(loginDto.email);

    // Check if user exists
    if (!user) {
      this.logger.warn(
        `Login failed - User not found for email: ${loginDto.email}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'User not found with this email address',
      });
    }

    // Check if user is using email provider
    if (user.provider !== String(AuthProvidersEnum.email)) {
      this.logger.warn(
        `Login failed - User must login via ${user.provider} provider for email: ${loginDto.email}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `Please login using your ${user.provider} account`,
      });
    }

    // Check if user has a password set
    if (!user.password) {
      this.logger.warn(
        `Login failed - No password set for email: ${loginDto.email}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Password not set for this account',
      });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      this.logger.warn(
        `Login failed - Invalid password for email: ${loginDto.email}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid email or password',
      });
    }

    // Generate session hash
    this.logger.log(`Password validated successfully for user: ${user.id}`);
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    // Create new session
    const newSession = new SessionEntity();
    newSession.user = user;
    newSession.hash = hash;
    const session = await this.sessionService.create(newSession);
    this.logger.log(
      `New session created with id: ${session.id} for user: ${user.id}`,
    );

    // Generate tokens
    const { token, refreshToken, tokenExpires, refreshExpires } =
      await this.getTokensData({
        id: user.id,
        role: user.role,
        sessionId: session.id,
        hash,
      });

    this.logger.log(`Login successful for user: ${user.id}`);
    return {
      refreshToken,
      token,
      tokenExpires,
      refreshExpires,
    };
  }

  /**
   * Register new user with OTP-based email confirmation
   * Generates OTP code, stores it in Redis, and sends confirmation email
   */
  async register(dto: AuthRegisterLoginDto): Promise<CommonResponse<null>> {
    this.logger.log(`Register flow started for email: ${dto.email}`);

    // Create user with inactive status
    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.user,
      },
      status: {
        id: StatusEnum.inactive,
      },
    });

    this.logger.log(`User created with id: ${user.id}`);

    // Generate JWT hash for additional security (optional, kept for compatibility)
    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );
    this.logger.log(`Confirmation hash generated for user id: ${user.id}`);

    // Generate 6-digit OTP code
    const otpCode = this.otpService.generateOtpCode();
    this.logger.log(`OTP code generated for user id: ${user.id}`);

    // Store OTP in Redis with 5-minute expiration
    await this.otpService.storeOtp(dto.email, otpCode);
    this.logger.log(`OTP stored in Redis for email: ${dto.email}`);

    // Send email with both hash and OTP code
    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
        otpCode,
      },
    });
    this.logger.log(`Sign up email with OTP sent to: ${dto.email}`);

    return {
      status: HttpStatus.OK,
      message:
        'User registered successfully. Please check your email for the 6-digit verification code.',
      data: null,
    };
  }

  /**
   * Confirm email using OTP code
   * Verifies the 6-digit OTP code against stored value in Redis
   */
  async confirmEmailWithOtp(
    email: string,
    otpCode: string,
  ): Promise<CommonResponse<null>> {
    this.logger.log(`Email confirmation with OTP started for email: ${email}`);

    // Verify OTP code
    const isValidOtp = await this.otpService.verifyOtp(email, otpCode);
    if (!isValidOtp) {
      this.logger.warn(`Invalid or expired OTP for email: ${email}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired verification code',
      });
    }

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.error(`User not found for email: ${email}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    // Check if user is in inactive status
    if (user?.status?.id?.toString() !== StatusEnum.inactive.toString()) {
      this.logger.warn(`User account already activated for email: ${email}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'User account is already activated',
      });
    }

    // Activate user account
    const userStatus = new StatusEntity();
    userStatus.id = StatusEnum.active;
    user.status = userStatus;

    await this.usersService.update(user.id, user);
    this.logger.log(`Successfully activated user account for email: ${email}`);

    // Clean up OTP data from Redis
    await this.otpService.resetOtpData(email);
    this.logger.log(`OTP data cleaned up for email: ${email}`);

    return {
      status: HttpStatus.OK,
      message: 'Email confirmed successfully. Your account is now active.',
      data: null,
    };
  }

  /**
   * Resend OTP code with rate limiting
   * Implements exponential backoff after maximum attempts
   */
  async resendOtp(
    email: string,
  ): Promise<CommonResponse<{ waitTime: number }>> {
    this.logger.log(`Resend OTP request for email: ${email}`);

    // Check if user exists and is inactive
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Resend OTP failed - User not found for email: ${email}`,
      );
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user?.status?.id?.toString() !== StatusEnum.inactive.toString()) {
      this.logger.warn(
        `Resend OTP failed - User already active for email: ${email}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'User account is already activated',
      });
    }

    // Check rate limiting
    const { canResend, waitTime, attemptsLeft } =
      await this.otpService.canResendOtp(email);

    if (!canResend) {
      this.logger.warn(
        `Resend OTP blocked - Rate limit exceeded for email: ${email}, wait time: ${waitTime}s`,
      );
      throw new BadRequestException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: `Too many resend attempts. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`,
        data: { waitTime },
      });
    }

    // Increment attempt counter
    await this.otpService.incrementResendAttempts(email);
    this.logger.log(
      `Resend attempt recorded for email: ${email}, attempts left: ${attemptsLeft - 1}`,
    );

    // Generate new OTP code
    const newOtpCode = this.otpService.generateOtpCode();
    this.logger.log(`New OTP code generated for resend: ${email}`);

    // Store new OTP in Redis
    await this.otpService.storeOtp(email, newOtpCode);
    this.logger.log(`New OTP stored in Redis for email: ${email}`);

    // Send resend email
    await this.mailService.resendOtp({
      to: email,
      data: {
        otpCode: newOtpCode,
      },
    });
    this.logger.log(`Resend OTP email sent to: ${email}`);

    return {
      status: HttpStatus.OK,
      message: `New verification code sent. You have ${attemptsLeft - 1} attempts remaining.`,
      data: { waitTime: 0 },
    };
  }

  /**
   * Get OTP status for debugging/monitoring
   * Returns current OTP state without exposing sensitive data
   */
  async getOtpStatus(email: string): Promise<{
    hasOtp: boolean;
    otpTtl: number;
    resendAttempts: number;
    cooldownTtl: number;
    canResend: boolean;
  }> {
    const [otpStats, resendInfo] = await Promise.all([
      this.otpService.getOtpStats(email),
      this.otpService.canResendOtp(email),
    ]);

    return {
      ...otpStats,
      canResend: resendInfo.canResend,
    };
  }

  private async getTokensData(data: {
    id: UserEntity['id'];
    role: UserEntity['role'];
    sessionId: SessionEntity['id'];
    hash: SessionEntity['hash'];
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });
    const refreshExpiresIn = this.configService.getOrThrow(
      'auth.refreshExpires',
      { infer: true },
    );

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires: ms(tokenExpiresIn),
      refreshExpires: ms(refreshExpiresIn),
    };
  }

  a; /**
   * Refreshes authentication tokens using a valid refresh token payload
   * This method validates the existing session and generates new access/refresh token pair
   *
   * @param data - Refresh token payload containing sessionId and hash for validation
   * @returns New token pair with expiration times (excludes user data for security)
   * @throws UnauthorizedException if session is invalid, not found, or hash mismatch
   */
  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    // STEP 1: Validate session existence
    // DEBUG: Retrieve the active session using the sessionId from refresh token payload
    const session = await this.sessionService.findById(data.sessionId);

    // SECURITY CHECK: Ensure session exists in database (prevents token replay attacks)
    if (!session) {
      this.logger.log(
        `[REFRESH DEBUG] Session not found for ID: ${data.sessionId}`,
      );
      throw new UnauthorizedException();
    }

    // STEP 2: Validate session integrity
    // SECURITY CHECK: Compare hash from refresh token with stored session hash
    // This prevents token hijacking and ensures the refresh token hasn't been tampered with
    this.logger.log(
      `[REFRESH DEBUG] Validating session hash for session ${data.sessionId} - expected: ${session.hash}, provided: ${data.hash}`,
    );

    if (session.hash !== data.hash) {
      this.logger.log(
        `[REFRESH DEBUG] Hash mismatch for session ${data.sessionId} - possible token tampering`,
      );
      throw new UnauthorizedException();
    }

    // STEP 3: Generate new session hash for security rotation
    // SECURITY MEASURE: Create new cryptographic hash to invalidate old refresh tokens
    // This ensures that each refresh operation invalidates previous refresh tokens
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    this.logger.log(
      `[REFRESH DEBUG] Generated new session hash for security rotation`,
    );

    // STEP 4: Validate user account status
    // BUSINESS LOGIC: Ensure the user account is still active and has valid role
    const user = await this.usersService.findById(session.user.id);

    // SECURITY CHECK: Verify user exists and has assigned role (prevents access with deleted/disabled accounts)
    if (!user?.role) {
      this.logger.log(
        `[REFRESH DEBUG] User not found or no role assigned for user ID: ${session.user.id}`,
      );
      throw new UnauthorizedException();
    }

    // STEP 5: Update session with new hash
    // DATABASE OPERATION: Persist the new hash to invalidate old refresh tokens
    // This creates a security checkpoint - old refresh tokens become invalid after this update
    await this.sessionService.update(session.id, {
      hash,
    });

    this.logger.log(
      `[REFRESH DEBUG] Session ${session.id} updated with new hash - old refresh tokens invalidated`,
    );

    // STEP 6: Generate new token pair
    // TOKEN GENERATION: Create fresh access token and refresh token with new hash
    // Both tokens will have updated expiration times and the refresh token will contain the new hash
    const { token, refreshToken, tokenExpires, refreshExpires } =
      await this.getTokensData({
        id: session.user.id,
        role: user.role,
        sessionId: session.id,
        hash, // New hash for the refresh token payload
      });

    this.logger.log(
      `[REFRESH DEBUG] New token pair generated for user ${user.id} - Access expires: ${tokenExpires}, Refresh expires: ${refreshExpires}`,
    );

    // RETURN: Send new tokens without user data (client should already have user info)
    // SECURITY: Exclude user data to minimize sensitive information in token refresh response
    return {
      token,
      refreshToken,
      tokenExpires,
      refreshExpires,
    };
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }
}
