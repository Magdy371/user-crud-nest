import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/auth.decorators'


//forwardRef to prevent Circular DI issue
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
   const requiredRole = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY,[context.getHandler(),context.getClass()])

    // If no role is required, allow access
    if (!requiredRole || requiredRole.length === 0 ) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user; // This should be set by your AuthGuard

    // Check if user exists (should be authenticated)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    
    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const roleValue = typeof user.role === 'string'? user.role: user.role?.name;

    //Check if user has any of the required roles
    const hasRequiredRole = rolesToCheck.some(role => roleValue === role);
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${rolesToCheck.join(', ')}, User role: ${roleValue}`,
      );
    }
    return true;
  }
}