import {Controller, Body, Param, Post, Get, Put, Delete, ParseIntPipe} from '@nestjs/common';
import { ProductService} from './product.service';
import { CreateProductDto } from './DTOs/create-product.dto';
import { UpdateProductDto } from './DTOs/update-product.dto';
import { Cachable } from '../common/guards/decorators/cacheable.decorator';
import { Public, CanCreate, CanRead, CanUpdate, CanDelete,  } from '../common/guards/decorators/casl.decorator'; 
@Controller('products')
export class ProductController {
  constructor( private service: ProductService ) {
  }

  @Post()
  @CanCreate('Product')
  async create(@Body() dto: CreateProductDto){
    return this.service.create(dto);
  }

  @Public()
  @Cachable({ ttl: 300 })
  @Get()
  async findAll(){
    return this.service.findAll();
  }

  @Public()
  @Cachable({ ttl: 300 })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id:number){
    return this.service.findOne(id);
  }

  @Public()
  @Cachable({ ttl: 300 })
  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number){
    return this.service.findByCategory(categoryId);
  }

  @CanUpdate('Product')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto){
    return this.service.update(id, dto);
  }

 @CanDelete('Product')  
 @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number){
    return this.service.remove(id);
  }


}
