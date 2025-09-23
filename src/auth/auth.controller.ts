import { Controller, Post, Body, Get, Request, ParseIntPipe, Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './DTOs/login.dto';
import { AuthResponse } from './DTOs/authResponse.dto';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import type { RegisterDto } from './DTOs/register.dto';
import { Public } from '../common/guards/decorators/auth.decorators'
import { Cachable } from '../common/guards/decorators/cacheable.decorator';

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
  async getProfile(@Request() req, @Res() res: Response) {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
      email: req.user.email
    });
  }

  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logOut(req.user.id);
  }
}