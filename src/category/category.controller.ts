import { Body, Param, Post, Get, Put, Delete, Controller, } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './DTOs/create.dto';
import { UpdateCategoryDto } from './DTOs/update.dto';
import { ParseIntPipe } from '@nestjs/common';
import { AdminOnly, Public } from '../common/guards/decorators/auth.decorators'
import { Cachable } from '../common/guards/decorators/cacheable.decorator';


@Controller('categories')
export class CategoryController {

  constructor(private service: CategoryService) {
  }

  @AdminOnly()
  @Post()
  async create(@Body() dto: CreateCategoryDto){
    return this.service.create(dto);
  }

  @Public()
  @Cachable({ ttl: 300 })
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Public()
  @Cachable({ ttl: 300 })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number){
    return this.service.findOne(id);
  }

  @AdminOnly()
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number,@Body() dto: UpdateCategoryDto){
    return this.service.update(id,dto);
  }

  @AdminOnly()
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number){
    return this.service.remove(id);
  }

}