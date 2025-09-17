/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';


export class CreateUser {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @MinLength(4)
  role: UserRole;
  

  @IsEmail()
  email: string;
}

