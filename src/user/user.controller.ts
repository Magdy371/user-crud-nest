/* eslint-disable prettier/prettier */
import {Controller, Get, Post, Put, Delete, Param, Body, UseGuards} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUser } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { ParseIntPipe } from '@nestjs/common';
import { UserOnly, AdminOnly, Public } from '../common/guards/decorators/auth.decorators'
import { RolesGuard } from '../common/guards/roles.guard';
import { Cachable } from '../common/guards/decorators/cacheable.decorator';


@Controller('users')
@UseGuards(RolesGuard) // Apply roles guard to all routes in this controller// plural is conventional
export class UserController {
  constructor(private readonly userService: UserService) {}

  //@UseGuards(new AuthGuard)
  //we will use guard on user Modules insted to be applied on the controllers of user Modules

  @Public()
  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Cachable()
  @UserOnly()
  @Get(':id/orders')
  async findUserOrders(@Param('id',ParseIntPipe) id: number){
    return this.userService.findUserOrders(id);
  }

  @UserOnly()
  @Get(':id')
  async findOne(@Param('id',ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @AdminOnly()
  async update(@Param('id',ParseIntPipe) id: number, @Body() data: UpdateUser): Promise<User> {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @AdminOnly()
  async delete(@Param('id',ParseIntPipe) id: number): Promise<User> {
    return this.userService.remove(+id);
  }

}
