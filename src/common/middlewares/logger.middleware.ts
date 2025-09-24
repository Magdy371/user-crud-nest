import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
@Injectable()
export class LoggerMiddleware implements NestMiddleware{
    private logger = new Logger('Http');
    use(req:Request, res:Response,next:NextFunction){
        const {method, originalUrl, ip, body, query} = req;
        const start = Date.now();
        const userAgent = req.get('user-agent') || '';
        //Extract user id I authenticated
        const userId = (req as any).user?.id

        res.on('finish',()=>{
            const {statusCode} = res;
            const responseTime = Date.now() - start;

            this.logger.log(`${method} ${originalUrl} ${statusCode} - ${responseTime}ms - IP: ${ip}` );

          const logData = {
            method,
            url: originalUrl,
            statusCode,
            responseTime,
            userId: userId || null,
            userAgent,
            ipAddress: ip,
            requestBody: this.sanatizebody(body),
            queryParams: query,
            timestamp: new Date(),
          }
        });
        //prepare log data for redis and Mongodb

        next();
    }
    private sanatizebody (body: any): any {
      const sensitiveFields = ['password', 'token', 'authorization'];
      const sanitized = { ...body };
      sensitiveFields.forEach(field=> {
        if (sanitized[field]){
          sanitized[field] = '***Redacted***';
        }
      });
      return sanitized;
    }
} 
