/* eslint-disable prettier/prettier */
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'

// support both admin rloles and User role
export const Role = Reflector.createDecorator<UserRole | UserRole[]>();

//Single role for convenice
export const Roles = (...roles: UserRole[]) => Role(roles);
export const AdminOnley = ()=>Role(UserRole.Admin)
export const UserOnly = ()=>Role(UserRole.User)
