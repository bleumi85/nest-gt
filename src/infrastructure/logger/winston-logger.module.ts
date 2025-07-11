import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';
import { RequestLoggerMiddleware } from './request-logger.middleware';

@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class WinstonLoggerModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
