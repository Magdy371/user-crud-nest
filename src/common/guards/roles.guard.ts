/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier,@typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './decorators/roles.decrator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required role from the decorator
    const requiredRole = this.reflector.get(Role, context.getHandler());

    // If no role is required, allow access
    if (!requiredRole) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user; // This should be set by your AuthGuard

    // Check if user exists (should be authenticated)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has the required role
    if (user.role !== requiredRole) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRole}, User role: ${user.role}`);
    }

    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    //Check if user has any of the required roles
    const hasRequiredRole = rolesToCheck.some(role=>user.role === role);
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${rolesToCheck.join(', ')}, User role: ${user.role}`,
      );
    }

    return true;
  }
}