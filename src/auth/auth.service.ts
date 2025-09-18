/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginDto } from  './DTOs/login.dto';
import { AuthResponse } from './DTOs/authResponse.dto';
import { RegisterDto} from './DTOs/register.dto';

@Injectable()
export class AuthService{
  constructor(private prisma: PrismaService, private jwtService: JwtService) {
  }
  async login(dto: LoginDto): Promise<AuthResponse>{
    // find User by email
    const {email, password} = dto;
    const user =await this.prisma.user.findUnique({where :{email},});
    if(!user){
      throw new UnauthorizedException("Invalid Credentials");
    }
    const isPasswordValid =await bcrypt.compare(password,user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //Generate JWT TOKEN
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
  async register (dto: RegisterDto): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data:{
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role
      },
    });
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}