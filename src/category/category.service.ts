import { Injectable, ConflictException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './DTOs/create.dto';
import { UpdateCategoryDto } from './DTOs/update.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService,
              @Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async create(data: CreateCategoryDto): Promise<Category> {
    const { name } = data;
    const categoryFound = await this.prisma.category.findUnique({
      where: { name },
    });

    if (categoryFound) {
      throw new ConflictException('This category already exists');
    }

    const createdCategory = await this.prisma.category.create({
      data,
    });
    await this.cacheManager.del('GET:/categories').catch(() => {
      this.logger.warn(`The cahe invalidate category List cahe`);
    });
    return createdCategory;
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async findOne(id: number): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new NotFoundException('Specified category not found');
    }

    return category;
  }

  async update(id: number, data: UpdateCategoryDto): Promise<Category> {
    const categoryFound = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!categoryFound) {
      throw new NotFoundException('The specified category not found');
    }
    if (data.name && data.name !== categoryFound.name) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { name: data.name },
      });
      if (existingCategory) {
        throw new ConflictException('A category with this name already exists');
      }
    }

    const updatedCategory =  this.prisma.category.update({
      where: { id },
      data,
    });
    try {
      await Promise.all([
        this.cacheManager.del(`GET:/categories/${id}`),
        this.cacheManager.del('GET:/categories'),
      ]);
      this.logger.debug(`Cache invalidated for category ${id} and categories list`);
    } catch (error) {
      this.logger.warn(
        `Cache invalidation partially failed for category ${id}: ${error.message}`,
        error.stack, // Include stack trace for better debugging
      );
    }
    return updatedCategory;
  }

  async remove(id: number): Promise<Category> { // Add return type
    const foundedCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!foundedCategory) {
      throw new NotFoundException('The specified category not found');
    }

    const products = await this.prisma.product.findMany({
      where: { categoryId: id },
    });

    if (products.length > 0) {
      throw new ConflictException('Cannot delete category with associated products');
    }

    const deletedCategory =  this.prisma.category.delete({
      where: { id },
    });
    try {
      await Promise.all([
        this.cacheManager.del(`GET:/categories/${id}`),
        this.cacheManager.del('GET:/categories'),
      ]);
      this.logger.debug(`Cache invalidated for category ${id} and categories list`);
    } catch (error) {
      this.logger.warn(
        `Cache invalidation partially failed for category ${id}: ${error.message}`,
        error.stack, // Include stack trace for better debugging
      );
    }
    return deletedCategory;
  }
}