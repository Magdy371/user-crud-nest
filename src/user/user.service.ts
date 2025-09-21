/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUser } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({where: { id },});
    if(!user){
       throw new NotFoundException(`User with id ${id} not found`)
    } 
    return user;
  }

  async update(id: number, dto: UpdateUser): Promise<User> {
  try {
    const user = await this.prisma.user.findUnique({where: {id},});
    if(!user){
      throw new NotFoundException('User not found');
    }
    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : user.password;
    return await this.prisma.user.update({ where: { id }, data :{
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        role: dto.role ?? user.role,
        password: hashedPassword,
      }});
  } catch {
    throw new NotFoundException(`User with id ${id} not found`);
  }
}


  async remove(id: number): Promise<User> {
  try {
    return await this.prisma.user.delete({ where: { id } });
  } catch {
    throw new NotFoundException(`User with id ${id} not found`);
  }
}
}
