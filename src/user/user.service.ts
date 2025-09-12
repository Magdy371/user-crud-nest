/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUser): Promise<User> {
    return this.prisma.user.create({ data });
  }

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

  async update(id: number, data: UpdateUser): Promise<User> {
  try {
    return await this.prisma.user.update({ where: { id }, data });
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
