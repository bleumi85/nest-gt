import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { winstonLogger } from './winston-logger';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly redactFields = ['password', 'token', 'authorization'];

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const timestamp = Date.now();
    const { method, originalUrl, headers, body, query } = req;

    req['requestId'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Sanitize sensitive data
    const safeBody = this.sanitizeData({ ...body });
    const safeHeaders = this.sanitizeData({
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'content-length': headers['content-length'],
      host: headers['host'],
      referer: headers['referer'],
    });

    winstonLogger.info({
      requestId,
      stage: 'start',
      method,
      url: originalUrl,
      timestamp,
      headers: safeHeaders,
      query,
      body: safeBody,
      ip: req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress,
    });

    const startHrTime = process.hrtime();

    res.on('finish', () => {
      const durationMs = this.calculateDuration(startHrTime);
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

      winstonLogger[logLevel]({
        requestId,
        stage: 'end',
        statusCode: res.statusCode,
        duration: `${durationMs} ms`,
        method,
        url: originalUrl,
        responseSize: res.getHeader('content-length'),
      });
    });

    res.on('error', err => {
      const errorTime = this.calculateDuration(startHrTime);

      winstonLogger.error({
        requestId,
        stage: 'error',
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        method,
        url: originalUrl,
        duration: `${errorTime} ms`,
      });
    });

    next();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    if (!data) return data;

    return Object.entries(data).reduce((acc, [key, value]) => {
      if (this.redactFields.includes(key.toLowerCase())) {
        acc[key] = '****';
      } else if (typeof value === 'object') {
        acc[key] = this.sanitizeData(value);
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});
  }

  private calculateDuration(startHrTime: [number, number]): string {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(startHrTime);
    const durationMs = (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;

    return durationMs.toFixed(2);
  }
}
