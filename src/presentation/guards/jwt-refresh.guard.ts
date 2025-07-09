import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IJwtRefreshPayload } from '@application/dtos/responses/user.response';
import { USER_REPOSITORY } from '@shared/constants/tokens';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.Refresh;

    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: IJwtRefreshPayload;

    try {
      payload = this.jwtService.verify<IJwtRefreshPayload>(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, refreshToken } = payload;

    // Validate refresh token
    const refreshTokenEntity = await this.authService.validateRefreshToken(refreshToken);
    if (!refreshTokenEntity) {
      throw new UnauthorizedException();
    }

    // Check if the user still exists
    const user = await this.userRepository.findById(userId);

    // If a user is not found or not active, throw an UnauthorizedException
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active or not found');
    }

    request.refreshPayload = payload;

    return true;
  }
}
