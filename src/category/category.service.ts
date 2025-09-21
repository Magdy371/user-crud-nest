import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './DTOs/create.dto';
import { UpdateCategoryDto } from './DTOs/update.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto): Promise<Category> {
    const { name } = data;
    const categoryFound = await this.prisma.category.findUnique({
      where: { name },
    });

    if (categoryFound) {
      throw new ConflictException('This category already exists');
    }

    return this.prisma.category.create({
      data,
    });
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

  async update(id: number, data: UpdateCategoryDto): Promise<Category> { // Add return type
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

    return this.prisma.category.update({
      where: { id },
      data, // Use the data object, not the class reference
    });
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

    return this.prisma.category.delete({
      where: { id },
    });
  }
}