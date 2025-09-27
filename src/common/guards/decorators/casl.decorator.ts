import { SetMetadata } from '@nestjs/common';
import { IPermissionHandler } from '../casl.guard';


export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CHECK_PERMISSIONS_KEY = 'permissions';
export type RequiredPermission = IPermissionHandler;

export const CheckPermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(CHECK_PERMISSIONS_KEY, permissions);

// Helper function to create permission handlers
export const CreatePermission = (action: string, subject: string) => ({
  handle: (ability: any) => ability.can(action, subject)
});

// Convenience decorators for common actions
export const CanCreate = (subject: string) => 
  CheckPermissions(CreatePermission('create', subject));

export const CanRead = (subject: string) => 
  CheckPermissions(CreatePermission('read', subject));

export const CanUpdate = (subject: string) => 
  CheckPermissions(CreatePermission('update', subject));

export const CanDelete = (subject: string) => 
  CheckPermissions(CreatePermission('delete', subject));

export const CanManage = (subject: string) => 
  CheckPermissions(CreatePermission('manage', subject));

// Role-based shortcut decorators
export const AdminOnly = () => 
  CheckPermissions(CreatePermission('manage', 'all'));

export const UserOnly = () => 
  CheckPermissions(CreatePermission('read', 'User'));