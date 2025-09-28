import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAbility, CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { RequiredPermission, CHECK_PERMISSIONS_KEY, IS_PUBLIC_KEY } from './decorators/casl.decorator';

export interface IPermissionHandler {
  handle(ability: AppAbility): boolean;
}

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.get<RequiredPermission[]>(
      CHECK_PERMISSIONS_KEY,
      context.getHandler(),
    ) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    //to create a new ability object for the authenticated user, which contains all their defined permissions.
    const ability = this.abilityFactory.createForUser(user);

    // If no specific permissions required, just check if user is authenticated
    if (requiredPermissions.length === 0) {
      return true;
    }

    //It iterates through all the requiredPermissions and calls the handle() 
    // method on each one, passing the user's ability object.
    const hasPermission = requiredPermissions.every((permission) =>
      permission.handle(ability)
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}