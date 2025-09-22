import { Controller, Post, Body, Get, Request, ParseIntPipe, Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './DTOs/login.dto';
import { AuthResponse } from './DTOs/authResponse.dto';
import { User } from '@prisma/client';
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

  @Cachable()
  @Get('profile')
  async getProfile(@Request() req): Promise<User> {
    return req.user;
  }
  @Post('logout/:id')
  async logout(@Param('id',ParseIntPipe) id: number) {
    return this.authService.logOut(id);
  }
}