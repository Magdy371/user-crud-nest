import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { Public } from './decorators/auth.decorators'
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
    /**
     * //This One is Used Only for Handler not class
     *     const isPublic = this.reflector.get(Public, context.getHandler());
     * */
    //This One for a Handler level 'Method()' or Class Level
    const isPublic = this.reflector.getAllAndOverride(Public,[context.getHandler(),context.getClass()]);
    if (isPublic) {
      return true; // If the route is public, bypass the guard
    }

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Access Token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub || payload.userId,
        },
      });
      if (!user) {
        throw new UnauthorizedException('user not found');
      }
      // Attach user to request object for use in controllers and other guards
      request.user = user;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader (request:Request):string | undefined{
    const authHeaders = request.headers.authorization;
    if(!authHeaders){
      return undefined
    }
    const [type, token] =authHeaders.split(' ');
    if(type !== 'Bearer' || !token){
      return token;
    }
  }
}