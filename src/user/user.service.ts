import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUser } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {role: true,},});
  }
  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: {role: true,},});
    if(!user){
       throw new NotFoundException(`User with id ${id} not found`)
    } 
    return user;
  }

  async findUserOrders(id: number){
    const userWithOrders = await this.prisma.user.findUnique({
      where: { id },
      select: {
        role: {select: {name: true}},
        Order: {
          select: {
            id: true, total: true, status: true,
            orderItems: {
              select: { product: { select: { name: true, price: true, }, },
              },
            },
          },
        },
      },
    });

    if (!userWithOrders) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return userWithOrders.Order;
  }

  async update(id: number, dto: UpdateUser): Promise<User> {
  try {
    const user = await this.prisma.user.findUnique({where: { id },include: { role: true },});
    if(!user){
      throw new NotFoundException('User not found');
    }

     // If roleId is provided, verify the role exists
      if (dto.roleId) {
        const role = await this.prisma.role.findUnique({
          where: { id: dto.roleId },
        });
        if (!role) {
          throw new NotFoundException('Role not found');
        }
      }

    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : user.password;
    return await this.prisma.user.update({ where: { id }, data :{
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        roleId: dto.roleId ?? user.roleId,
        password: hashedPassword,
      },
      include:{
        role: true
      }
    });
  } catch {
    throw new NotFoundException(`User with id ${id} not found`);
  }
}


  async remove(id: number): Promise<User> {
    try {
      const deletedUser = await this.prisma.user.delete({ 
        where: { id },
        include: {
          role: true, // Include role in response
        },
      });
      return deletedUser;
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
  
}
