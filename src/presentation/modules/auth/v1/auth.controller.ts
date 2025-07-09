import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// DTOs
import { RegisterDto } from '@application/dtos/auth/register.dto';
import { LoginDto } from '@application/dtos/auth/login.dto';
import { VerifyOtpDto } from '@application/dtos/auth/verify-otp.dto';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import {
  SendVerificationEmailDto,
  VerifyEmailDto,
} from '@application/dtos/auth/email-verification.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '@application/dtos/auth/password-reset.dto';

// Commands
import { RegisterUserCommand } from '@application/commands/auth/register-user.command';
import { LoginCommand } from '@application/commands/auth/login.command';
import { VerifyOtpCommand } from '@application/commands/auth/verify-otp.command';
import { RefreshTokenCommand } from '@application/commands/auth/refresh-token.command';
import { LogoutCommand } from '@application/commands/auth/logout.command';
import { SendVerificationEmailCommand } from '@application/commands/auth/send-verification-email.command';
import { VerifyEmailCommand } from '@application/commands/auth/verify-email.command';
import { CheckEmailVerificationStatusCommand } from '@application/commands/auth/check-email-verification-status.command';
import { RequestPasswordResetCommand } from '@application/commands/auth/request-password-reset.command';
import { ResetPasswordCommand } from '@application/commands/auth/reset-password.command';

// Guards & Decorators
import { Public } from '@shared/decorators/public.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { SkipThrottle, Throttle } from '@shared/decorators/throttle.decorator';
import { IJwtPayload } from '@application/dtos/responses/user.response';
import { VersionsEnum } from '@shared/constants/versions';

@ApiTags('auth')
@Throttle(60, 5) // 5 requests per minute
@Controller({ path: 'auth', version: '1' })
export class AuthV1Controller {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.commandBus.execute(new RegisterUserCommand(registerDto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'User successfully authenticated. Returns access token, refresh token, and user data. May return OTP requirement if 2FA is enabled.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.commandBus.execute(new LoginCommand(loginDto, VersionsEnum.V1));
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code for 2FA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully. Returns access token, refresh token, and user data.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid OTP code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        otp: { type: 'string', example: '123456' },
      },
    },
  })
  async verifyOtp(@Body('userId') userId: string, @Body() verifyOtpDto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(userId, verifyOtpDto));
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully. Returns new access token and refresh token.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(refreshTokenDto, VersionsEnum.V1));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout the current user and revoke all refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged out successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async logout(@CurrentUser() user: IJwtPayload) {
    return this.commandBus.execute(new LogoutCommand(user.sub));
  }

  @Get('me')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User information retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async me(@CurrentUser() user: IJwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      roles: user.roles,
    };
  }

  @Public()
  @Post('email/send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid email format' })
  async sendVerificationEmail(@Body() sendVerificationEmailDto: SendVerificationEmailDto) {
    return this.commandBus.execute(new SendVerificationEmailCommand(sendVerificationEmailDto));
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with verification code',
    description:
      'Verify email with the code received. If successful, returns auth tokens like the login endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Email verified successfully. Returns access token, refresh token, and user data if verification successful.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification code',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.commandBus.execute(new VerifyEmailCommand(verifyEmailDto, VersionsEnum.V1));
  }

  @Public()
  @Get('email/status/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if an email is verified' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the verification status of the email',
  })
  async checkEmailVerificationStatus(@Param('email') email: string) {
    const isVerified = await this.commandBus.execute(
      new CheckEmailVerificationStatusCommand(email),
    );

    return { verified: isVerified };
  }

  @Public()
  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid email format' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.commandBus.execute(new RequestPasswordResetCommand(requestPasswordResetDto));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired token' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid password format' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.commandBus.execute(new ResetPasswordCommand(resetPasswordDto));
  }
}
