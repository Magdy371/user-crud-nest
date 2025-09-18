import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { Public } from './decorators/public.decorator'
import { Reflector} from '@nestjs/core';
// Extend Request interface to include user
declare module 'express' {
  interface Request {
    user?: User;
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService, private reflector: Reflector) {
  }
  async canActivate(context:ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get(Public, context.getHandler());
    if (isPublic) {
      return true; // If the route is public, bypass the guard
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if(!token){
      throw new UnauthorizedException('Access Token is required');
    }
    try{
      const payload = await this.jwtService.verifyAsync(token, {
        secret:process.env.JWT_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where:{
          id: payload.sub || payload.userId
        }
      });
      if(!user){
        throw new UnauthorizedException('user not found');
      }
      // Attach user to request object for use in controllers and other guards
      request.user= user;
    }catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader (request:Request):string | undefined{
    const [type, token] = request.headers.authorization?.split(' ')??[];
    return type === 'Bearer'? token:undefined
  }
}