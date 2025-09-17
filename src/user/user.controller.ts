/* eslint-disable prettier/prettier */
import {Controller, Get, Post, Put, Delete, Param, Body} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { ParseIntPipe } from '@nestjs/common';
//import { AuthGuard } from '../common/guards/auth.guard';

@Controller('users') // plural is conventional
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: CreateUser): Promise<User> {
    return this.userService.create(data);
  }

  //@UseGuards(new AuthGuard)
  //we will use guard on user Modules insted to be applied on the controllers of user Modules
  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id',ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id',ParseIntPipe) id: number, @Body() data: UpdateUser): Promise<User> {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id',ParseIntPipe) id: number): Promise<User> {
    return this.userService.remove(+id);
  }
}
