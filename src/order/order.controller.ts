import { Body, Param, Post, Get, Put, Delete, Controller, ParseIntPipe, Request, UseGuards, } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './DTOs/create-order.dto';
import { UpdateOrderDto } from './DTOs/update-order.dto';
import { OrderStatus } from '@prisma/client';
import { Cachable } from '../common/guards/decorators/cacheable.decorator';
import { CanCreate, CanRead, CanUpdate, CanDelete } from '../common/guards/decorators/casl.decorator';

@Controller('orders')
export class OrderController {
  constructor(private service: OrderService) {
  }
  
  @CanCreate('Order')
  @Post()
  async create(@Request() req, @Body() dto: CreateOrderDto){
    return this.service.create(req.user.id, dto);
  }

  @CanRead('Order')
  @Get()
  @Cachable({ ttl: 300 })
  async findAll(@Request() req) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @CanRead('Order')
  @Get(':id')
  @Cachable({ ttl: 300 })
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.user.id, req.user.role);
  }

  @CanUpdate('Order')
  @Put(':id')
  async update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto, req.user.id, req.user.role);
  }

  @CanUpdate('Order')
  @Put(':id/status')
  async updateStatus(@Request() req, @Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus) {
    return this.service.updateStatus(id, status, req.user.id, req.user.role);
  }

  @CanDelete('Order')
  @Delete(':id')
  async delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, req.user.id, req.user.role);
  }
}
