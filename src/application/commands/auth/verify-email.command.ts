import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailDto } from '@application/dtos/auth/email-verification.dto';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@core/services/auth.service';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import {
  IAuthTokenResponse,
  IJwtPayload,
  IJwtRefreshPayload,
} from '@application/dtos/responses/user.response';
import { UserMapper } from '@application/mappers/user.mapper';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '@shared/constants/tokens';
import { VersionsEnum } from '@shared/constants/versions';
import ms from 'enhanced-ms';
import { UnknownVersionException } from '@core/exceptions/domain-exceptions';

export class VerifyEmailCommand extends Command<IAuthTokenResponse | { verified: boolean }> {
  constructor(
    public readonly verifyEmailDto: VerifyEmailDto,
    public readonly version: VersionsEnum,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler
  implements ICommandHandler<VerifyEmailCommand, IAuthTokenResponse | { verified: boolean }>
{
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<IAuthTokenResponse | { verified: boolean }> {
    const {
      verifyEmailDto: { email, code },
      version,
    } = command;

    // Verify the email code
    const verified = await this.authService.verifyEmailCode(email, code);

    if (!verified) {
      return { verified: false };
    }

    // If verification succeeded, we can immediately login the user
    // 1. Find the user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Update last login
    await this.authService.updateLastLogin(user.id.getValue());

    // 3. Collect all permissions from all user roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id.getValue());
      if (roleWithPermissions && roleWithPermissions.permissions) {
        roleWithPermissions.permissions.forEach(permission => {
          userPermissions.add(permission.getStringName());
        });
      }
    }

    // 4. Generate JWT tokens
    const accessPayload: IJwtPayload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: true,
      roles: user.roles.map(role => role.name),
      permissions: Array.from(userPermissions),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const expirationRefreshMs = ms(refreshExpiresIn);
    const refreshTokenUuid = uuidv4();
    await this.authService.createRefreshToken(user.id.getValue(), refreshTokenUuid);
    const refreshPayload: IJwtRefreshPayload = {
      sub: user.id.getValue(),
      refreshToken: refreshTokenUuid,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });
    const refreshTokenCookie = `Refresh=${refreshToken}; Max-Age=${expirationRefreshMs / 1000}; Path=/; HttpOnly; Secure; SameSite=Strict`;

    // 5. Return tokens and user information
    if (version === VersionsEnum.V1) {
      return {
        accessToken,
        refreshToken: refreshTokenUuid,
        user: UserMapper.toAuthResponse(user, true),
      };
    } else if (version === VersionsEnum.V2) {
      return {
        accessToken,
        refreshToken: refreshTokenCookie,
        user: UserMapper.toAuthResponse(user, true),
      };
    }
    throw new UnknownVersionException(version);
  }
}
