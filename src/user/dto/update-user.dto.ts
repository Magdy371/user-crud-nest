/* eslint-disable prettier/prettier */
import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUser {
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @MinLength(4)
  role?: UserRole;

  @IsOptional()
  @IsEmail()
  email?: string;
}
