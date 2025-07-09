import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@core/services/auth.service';

export class LogoutCommand extends Command<{ message: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, { message: string }> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const { userId } = command;

    // Revoke all refresh tokens for this user
    await this.authService.revokeAllRefreshTokens(userId);

    return { message: 'Logged out successfully' };
  }
}
