/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { winstonLogger } from './winston-logger';

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLoggerService implements NestLoggerService {
  private readonly logger: Logger;
  private context?: string;

  constructor() {
    this.logger = winstonLogger;
  }

  setContext(context: string): this {
    this.context = context;

    return this;
  }

  log(message: string | Record<string, any>, context?: string) {
    this.logger.info({ message, context: context || this.context });
  }

  error(message: string | Record<string, any>, trace?: string, context?: string) {
    this.logger.error({ message, trace, context: context || this.context });
  }

  warn(message: string | Record<string, any>, context?: string) {
    this.logger.warn({ message, context: context || this.context });
  }

  debug(message: string | Record<string, any>, context?: string) {
    this.logger.debug({ message, context: context || this.context });
  }

  verbose(message: string | Record<string, any>, context?: string) {
    this.logger.verbose({ message, context: context || this.context });
  }
}
