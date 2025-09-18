/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, isNotEmpty, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';


export class CreateUser {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @MinLength(4)
  role: UserRole;

  @IsNotEmpty()
  password:string;

  @IsEmail()
  email: string;
}

