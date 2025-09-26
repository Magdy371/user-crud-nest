/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, isNotEmpty, IsNotEmpty, MinLength } from 'class-validator';


export class CreateUser {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @MinLength(4)
  roleId: number;

  @IsNotEmpty()
  password:string;

  @IsEmail()
  email: string;
}

