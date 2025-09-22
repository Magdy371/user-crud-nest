import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from  './DTOs/login.dto';
import { AuthResponse } from './DTOs/authResponse.dto';
import { RegisterDto} from './DTOs/register.dto';
import { User } from '@prisma/client';

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
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id,tokens.ref_token);
    return {
      access_token: tokens.access_token,
      ref_token: tokens.ref_token,
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
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id,tokens.ref_token);
    return {
      access_token: tokens.access_token,
      ref_token: tokens.ref_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logOut(id: number){
    await this.prisma.user.update({
      where:{id},
      data:{
        ref_token: null,
        ref_tokenExpireDate: null
      }
    });
    return {message: 'Logged Out Successfully'}
  }

  private async genereate_Token(user:User):Promise<string>{
    //Generate JWT TOKEN
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    return this.jwtService.signAsync(payload,{
      secret:process.env.JWT_SECRET,
      expiresIn:'2h'
    });
  }

  private async genrateRef_token(user: User): Promise<string>{
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    return this.jwtService.signAsync(payload,{
      secret:process.env.JWT_SECRET,
      expiresIn:'7d'
    });
  }
  private async updateRefreshToken(id: number, ref_token: string): Promise<void> {
    // Calculate expiration date (7 days from now)
    const ref_tokenExpireDate = new Date();
    ref_tokenExpireDate .setDate(ref_tokenExpireDate .getDate() + 7);

    await this.prisma.user.update({
      where: { id },
      data: {
        ref_token,
        ref_tokenExpireDate ,
      },
    });
  }
  private async getTokens(user: User): Promise<{ access_token: string; ref_token: string }> {
    const [access_token,ref_token] = await Promise.all([
      this.genereate_Token(user),
      this.genrateRef_token(user),
    ]);
    return { access_token, ref_token };
  }

}
