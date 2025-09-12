/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
@Catch()// to catch every exception
export class GlobalExceptionFilter implements ExceptionFilter{
    catch(exception:unknown,host:ArgumentsHost){
        const curH = host.switchToHttp();
        const request = curH.getRequest<Request>();
        const response = curH.getResponse<Response>();
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | object = 'Internal server error';
        //Handling HttpExceptions
        if(exception instanceof HttpException){
            status = exception.getStatus();
            message = exception.getResponse();
        }
        else if(exception instanceof Prisma.PrismaClientKnownRequestError){
            switch (exception.code) {
                case 'P2002':
                status = HttpStatus.BAD_REQUEST;
                message = 'Unique constraint failed';
                break;
                case 'P2025':
                status = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                break;
                default:
                message = exception.message;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        response.json({
            statusCode:status,
            message,
            path:request.url,
            timestamp: new Date().toISOString(),
        })
    }
}