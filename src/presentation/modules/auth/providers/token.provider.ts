import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/entities/user.entity';
import { VersionsEnum } from '@shared/constants/versions';
import ms from 'enhanced-ms';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Generate a JWT payload with user information
   */
  buildPayload(user: User, permissions: string[], isEmailVerified: boolean) {
    return {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: isEmailVerified,
      roles: user.roles.map(role => role.name),
      permissions: permissions,
    };
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  /**
   * Generate a refresh token and store it
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(userId, refreshToken);

    return refreshToken;
  }

  generateRefreshTokenCookie(userId: string, refreshToken: string): string {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const token = this.jwtService.sign(
      { sub: userId, refreshToken },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn,
      },
    );
    const expirationMs = ms(expiresIn);

    return `Refresh=${token}; Max-Age=${expirationMs / 1000}; Path=/; HttpOnly; Secure; SameSite=Strict`;
  }

  /**
   * Generate both access and refresh tokens for a user
   */
  async generateTokens(
    user: User,
    permissions: string[],
    isEmailVerified: boolean,
    version: VersionsEnum,
  ) {
    const accessPayload = this.buildPayload(user, permissions, isEmailVerified);
    const accessToken = this.generateAccessToken(accessPayload);
    const refreshToken = await this.generateRefreshToken(user.id.getValue());
    const refreshTokenCookie = this.generateRefreshTokenCookie(user.id.getValue(), refreshToken);

    if (version === VersionsEnum.V1) {
      return {
        accessToken,
        refreshToken,
      };
    } else if (version === VersionsEnum.V2) {
      return {
        accessToken: accessToken,
        refreshToken: refreshTokenCookie,
      };
    }
    throw new Error('Failed to generate tokens');
  }
}
