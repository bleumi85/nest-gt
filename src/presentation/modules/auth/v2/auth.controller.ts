import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

// DTOs
import { LoginDto } from '@application/dtos/auth/login.dto';
import { VerifyEmailDto } from '@application/dtos/auth/email-verification.dto';

// Commands
import { LoginCommand } from '@application/commands/auth/login.command';
import { LogoutCommand } from '@application/commands/auth/logout.command';
import { RefreshTokenCommand } from '@application/commands/auth/refresh-token.command';
import { VerifyEmailCommand } from '@application/commands/auth/verify-email.command';

// Guards & Decorators
import { Public } from '@shared/decorators/public.decorator';
import {
  IJwtPayload,
  IJwtRefreshPayload,
  isIAuthTokenResponse,
} from '@application/dtos/responses/user.response';
import { VersionsEnum } from '@shared/constants/versions';
import { JwtRefreshGuard } from '@presentation/guards/jwt-refresh.guard';
import { CurrentRefreshPayload } from '@shared/decorators/current-refresh-payload.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '2' })
export class AuthV2Controller {
  constructor(private readonly commandBus: CommandBus) {}

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
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.commandBus.execute(new LoginCommand(loginDto, VersionsEnum.V2));
    if (isIAuthTokenResponse(response)) {
      const { refreshToken, ...rest } = response;
      res.setHeader('Set-Cookie', [refreshToken]);

      return rest;
    }

    return response;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully. Returns new access token and refresh token.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshToken(
    @CurrentRefreshPayload() { refreshToken }: IJwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken: newRefreshToken, ...rest } = await this.commandBus.execute(
      new RefreshTokenCommand({ refreshToken }, VersionsEnum.V2),
    );
    res.setHeader('Set-Cookie', [newRefreshToken]);

    return rest;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout the current user and revoke all refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged out successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async logout(@CurrentUser() user: IJwtPayload, @Res({ passthrough: true }) res: Response) {
    const respose = await this.commandBus.execute(new LogoutCommand(user.sub));

    res.setHeader('Set-Cookie', ['Refresh=; HttpOnly; Path=/; Max-Age=0']);

    return respose;
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
    const response = await this.commandBus.execute(
      new VerifyEmailCommand(verifyEmailDto, VersionsEnum.V2),
    );

    return response;
  }
}
