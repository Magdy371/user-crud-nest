/* eslint-disable prettier/prettier */
import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateUser {
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @MinLength(4)
  roleId?: number;

  @IsOptional()
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
