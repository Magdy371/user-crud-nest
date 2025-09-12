/* eslint-disable prettier/prettier */
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    switch (exception.code) {
      case 'P2002': // Unique constraint failed
        return response.status(400).json({
          statusCode: 400,
          message: 'Unique constraint failed',
        });
      case 'P2025': // Record not found
        return response.status(404).json({
          statusCode: 404,
          message: 'Record not found',
        });
      default:
        return response.status(500).json({
          statusCode: 500,
          message: exception.message,
        });
    }
  }
}
