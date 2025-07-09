import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

// Constants
import {
  EMAIL_VERIFICATION_REPOSITORY,
  OTP_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from '@shared/constants/tokens';

// Controllers
import { AuthV2Controller } from './auth.controller';

// Repositories & Providers
import { EmailVerificationRepository } from '@infrastructure/repositories/email-verification.repository';
import { OtpRepository } from '@infrastructure/repositories/otp.repository';
import { PasswordResetRepository } from '@infrastructure/repositories/password-reset.repository';
import { RefreshTokenRepository } from '@infrastructure/repositories/refresh-token.repository';
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { EmailProvider } from '../providers/email.provider';
import { TokenProvider } from '../providers/token.provider';

// Services & Modules
import { CoreModule } from '@core/core.module';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';

// Command Handlers
import { LoginCommandHandler } from '@application/commands/auth/login.command';
import { RefreshTokenCommandHandler } from '@application/commands/auth/refresh-token.command';
import { VerifyEmailCommandHandler } from '@application/commands/auth/verify-email.command';

// Strategies
import { JwtStrategy } from '../strategies/jwt.strategy';

const commandHandlers = [
  LoginCommandHandler,
  RefreshTokenCommandHandler,
  VerifyEmailCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    CoreModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthV2Controller],
  providers: [
    // Services
    AuthService,
    UserService,

    // Repository Tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: OTP_REPOSITORY,
      useClass: OtpRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: EMAIL_VERIFICATION_REPOSITORY,
      useClass: EmailVerificationRepository,
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PasswordResetRepository,
    },

    // Providers
    EmailProvider,
    TokenProvider,

    // Strategy
    JwtStrategy,

    // Command Handlers
    ...commandHandlers,
  ],
  exports: [AuthService],
})
export class AuthV2Module {}
