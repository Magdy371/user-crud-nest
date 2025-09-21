import { Module} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  providers: [PrismaService, ProductService],
  controllers: [ProductController,],
})
export class ProductModule{}