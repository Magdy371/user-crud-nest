import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Module({
  providers: [ PrismaService, OrderService ],
  controllers: [ OrderController ],
})
export class OrderModule{}