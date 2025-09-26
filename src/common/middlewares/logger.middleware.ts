import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('Http');
  constructor( private redisService: RedisService){}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, body, query } = req;
    const start = Date.now();
    const userAgent = req.get('user-agent') || '';
    const userId = (req as any).user?.id;

    // Normalize IP (show IPv4 instead of ::1 when local)
    const ipAddress = ip === '::1' ? '127.0.0.1' : ip;

    res.on('finish', async () => {
      const { statusCode } = res;
      const responseTime = Date.now() - start;

      // Sanitize and stringify body
      const sanitizedBody = this.sanitizeBody(body);

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${responseTime}ms - IP: ${ipAddress}\n` +
        `Request Body: ${JSON.stringify(sanitizedBody, null, 2)}`
      );

      // You can also send this to Redis/MongoDB later
      const logData = {
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        userId: userId || null,
        userAgent,
        ipAddress,
        requestBody: sanitizedBody,
        queryParams: query,
        timestamp: new Date(),
      };

      try {
        await this.redisService.publishLog(logData)
      } catch (error) {
        this.logger.error(`Failed to send log to Redis, ${error.message}`);
      }
    });

    next();
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'authorization'];
    const sanitized = { ...body };
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***Redacted***';
      }
    });
    return sanitized;
  }
}
