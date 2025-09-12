/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUser {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

