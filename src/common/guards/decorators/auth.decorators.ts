import {  Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

export const Public = Reflector.createDecorator<boolean>();
export const Roles = Reflector.createDecorator<UserRole[]>();

//ConvenientHelper
export const AdminOnly = ()=>Roles[UserRole.Admin];
export const UserOnly = ()=> Roles[UserRole.User];