import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './DTOs/login.dto';
import { AuthResponse } from './DTOs/authResponse.dto';
import { User } from '@prisma/client';
import type { RegisterDto } from './DTOs/register.dto';
import { Public } from '../common/guards/decorators/auth.decorators'
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Get('profile')
  async getProfile(@Request() req): Promise<User> {
    return req.user;
  }
  @Post('logout')
  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }
}