import {Injectable, Inject, Logger, NotFoundException, ConflictException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './DTOs/create-product.dto';
import { UpdateProductDto } from './DTOs/update-product.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(private prisma: PrismaService,
              @Inject(CACHE_MANAGER) private cacheManger: Cache) {
  }

  async create(dto: CreateProductDto){
    const {name, categoryId} = dto;
    const categoryFoud = await this.prisma.category.findUnique(
      {
        where :{id:categoryId},
      }
    );
    if(!categoryFoud){
      throw new NotFoundException('The specified Ctegory not found to attach it');
    }
    const FoundedProduct = await this.prisma.product.findFirst({
      where: {name},
    });
    if(FoundedProduct){
      throw new ConflictException('The product is already exist')
    }
    const newProduct = await this.prisma.product.create({
      data:{
        name: dto.name,
        description: dto.description,
        price: dto.price,
        category: { connect: { id: dto.categoryId } }
      },
      include: {category:true}
    });
    await this.invalidateCaheing(newProduct.categoryId, newProduct.id);
    return newProduct;
  }

  async findAll(): Promise<Product[]>{
    return this.prisma.product.findMany({
      include:{ category: true }
    });
  }

  async findByCategory(categoryId: number){
    const foundedCategory = await this.prisma.category.findUnique({
      where:{id:categoryId},
    });
    if(!foundedCategory){throw new NotFoundException('Specified Category not found')};
    return this.prisma.product.findMany({
      where:{categoryId},
      include:{category:true}
    });
  }

  async findOne(id: number): Promise<Product | null>{
    const foundedProduct = await this.prisma.product.findUnique({
      where: {id},
    });
    if(!foundedProduct){
      throw new NotFoundException('The Specified Product Not_Found');
    }
    return foundedProduct;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const { categoryId, ...rest } = dto;
    const foundedProduct = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!foundedProduct) {
      throw new NotFoundException('The specified product cannot be found');
    }
    let newCategoryId = categoryId;
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Specified category not found');
      }
      newCategoryId = categoryId;
    }
    if (rest.name && rest.name !== foundedProduct.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          name: rest.name, id: { not: id } },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
    }
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? foundedProduct.name,
        price: dto.price ?? foundedProduct.price,
        description: dto.description ?? foundedProduct.description,
        category: {
          connect: { id: dto.categoryId ?? foundedProduct.categoryId }
        }
      },
      include: { category: true }
    });
    await this.invalidateCaheing(newCategoryId || updatedProduct.categoryId, id);
    return updatedProduct;
  }

  async remove(id:number): Promise<Product>{
    const product = await this.prisma.product.findUnique({where:{id},});
    if(!product){throw new NotFoundException(`The product not found to be delted`);}
    //check if Products is on any Order items
    const orderItems = await this.prisma.orderItem.findMany({
      where:{productId:id}
    });
    if(orderItems.length > 0){
      throw new ConflictException('the product attached to order items');
    }
    const deletedProduct = await this.prisma.product.delete({
      where: { id },
    });
    await this.invalidateCaheing(product.categoryId,id);
    return deletedProduct;
  }

  private invalidateCaheing = async (categoryId: number, productId: number) => {
    try {
      await Promise.all([
        this.cacheManger.del(`GET:/products/${productId}`),
        this.cacheManger.del(`GET:/products`),
        this.cacheManger.del(`GET:/categories/${categoryId}`),
        this.cacheManger.del(`GET:/categories`),
      ]);
      this.logger.debug(`Cache invalidated for product ${productId}, category ${categoryId}, and related lists`);
    } catch (error) {
      this.logger.warn(
        `Cache invalidation partially failed for product ${productId}: ${error.message}`,
        error.stack,
      );
    }
  };

}