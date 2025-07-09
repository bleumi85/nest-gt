import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import {
  IAuthRefreshTokenResponse,
  IJwtPayload,
  IJwtRefreshPayload,
} from '@application/dtos/responses/user.response';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { ROLE_REPOSITORY, USER_REPOSITORY } from '@shared/constants/tokens';
import { VersionsEnum } from '@shared/constants/versions';
import ms from 'enhanced-ms';
import { UnknownVersionException } from '@core/exceptions/domain-exceptions';

export class RefreshTokenCommand extends Command<IAuthRefreshTokenResponse> {
  constructor(
    public readonly refreshTokenDto: RefreshTokenDto,
    public readonly version: VersionsEnum,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<IAuthRefreshTokenResponse> {
    const {
      refreshTokenDto: { refreshToken },
      version,
    } = command;

    // Validate refresh token
    const token = await this.authService.validateRefreshToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException();
    }

    // Get user
    const user = await this.userRepository.findById(token.userId.getValue());
    if (!user) {
      throw new UnauthorizedException();
    }

    // Revoke current refresh token
    await this.authService.revokeRefreshToken(refreshToken);

    // Collect all permissions from all user roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id.getValue());
      if (roleWithPermissions && roleWithPermissions.permissions) {
        roleWithPermissions.permissions.forEach(permission => {
          userPermissions.add(permission.getStringName());
        });
      }
    }

    // Check if email is verified
    const isEmailVerified = await this.authService.isEmailVerified(user.email.getValue());

    // Generate new JWT tokens
    const accessPayload: IJwtPayload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: isEmailVerified,
      roles: user.roles.map(role => role.name),
      permissions: Array.from(userPermissions),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    });

    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const expirationRefreshMs = ms(refreshExpiresIn);
    const newRefreshTokenUuid = uuidv4();
    await this.authService.createRefreshToken(user.id.getValue(), newRefreshTokenUuid);
    const refreshPayload: IJwtRefreshPayload = {
      sub: user.id.getValue(),
      refreshToken: newRefreshTokenUuid,
    };
    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });
    const refreshTokenCookie = `Refresh=${newRefreshToken}; Max-Age=${expirationRefreshMs / 1000}; Path=/; HttpOnly; Secure; SameSite=Strict`;

    if (version === VersionsEnum.V1) {
      return {
        accessToken,
        refreshToken: newRefreshTokenUuid,
      };
    } else if (version === VersionsEnum.V2) {
      return {
        accessToken,
        refreshToken: refreshTokenCookie,
      };
    }
    throw new UnknownVersionException(version);
  }
}
