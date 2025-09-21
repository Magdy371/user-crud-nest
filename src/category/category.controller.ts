import {
  Body,
  Param,
  Post,
  Get,
  Patch,
  Delete,
  Controller,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './DTOs/create.dto';
import { UpdateCategoryDto } from './DTOs/update.dto';
import { ParseIntPipe } from '@nestjs/common';


@Controller('categories')
export class CategoryController {

  constructor(private service: CategoryService) {
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto){
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number){
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, dto: UpdateCategoryDto){
    return this.service.update(id,dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number){
    return this.service.remove(id);
  }

}