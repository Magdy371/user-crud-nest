import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './DTOs/create-order.dto';
import { UpdateOrderDto } from './DTOs/update-order.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Order, OrderStatus, Prisma, } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor( private prisma: PrismaService, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }
  async create(userId: number, dto: CreateOrderDto): Promise<Order>{
    const { items } = dto;
    //check for products needed in Order
    const productIds = items.map(item=>item.productId);
    const products = await this.prisma.product.findMany({where:{id:{in: productIds}}});
    if(products.length !== productIds.length){
      throw new NotFoundException('One or more Exception not found');
    }
    // Calculate Order Total and Order Item
    let total = 0;
    const orderItems = items.map(item=>{
      const product = products.find((p=>p.id=== item.productId));
      if(!product){
        throw new NotFoundException('Product not found');
      }
      const itemTotal = product.price * item.quantity;
      total  += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      }
    });
    // Create border with its items
    const order = await this.prisma.order.create({
      data:{ userId, total, status: OrderStatus.Pending, orderItems: {create: orderItems},},
      include:{
        user: {select: {id: true, name: true, email: true} },
        orderItems:{include:{product: true},},
      }
    });
    this.invalidateUserOrderCache(userId);
    return order;
  }

  async findAll(userId: number, userRole: string): Promise<Order[]>{
    // Admins can see all orders, users can only see their own
    const where: Prisma.OrderWhereInput = userRole === 'Admin' ? {} : { userId };
    return this.prisma.order.findMany({
      where,
      include:{
        user: {select: {id: true, name: true, email: true} },
        orderItems:{include:{product: true},},
      },
      orderBy: {createdAt: 'desc'}
    });
  }

  async findOne( id: number, userId: number, userRole: string ){
    const order = await this.prisma.order.findUnique({
      where:{id},
      include:{
        user: {select: {id: true, name: true, email: true} },
        orderItems:{include:{product: true},},
      }
    });
    if(!order){throw new NotFoundException('Order not found')};

    if (userRole !== 'Admin' && order.userId !== userId) {throw new ForbiddenException('You can only access your own orders');}
    return order;
  }

  async update(id: number, dto: UpdateOrderDto, userId:number, userRole: string):  Promise<Order>{
    //check for orderId
    const order = await this.prisma.order.findUnique({where:{id},},);
    if(!order){throw new NotFoundException('Specified Order Not found');}

    if(userRole!=='Admin' && order.userId !== userId) { throw new ForbiddenException('You can only update your own orders');}
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data:dto,
      include: {
        user: { select: { id: true, name: true, email: true, }, },
        orderItems: { include: { product: true, }, },
      },
    });
    this.invalidateUserOrderCache(order.userId);
    return updatedOrder;
  }

  async remove(id: number, userId:number, userRole: string){
    //check for orderId
    const order = await this.prisma.order.findUnique({where:{id},},);
    if(!order){throw new NotFoundException('Specified Order Not found');}
    // Check permissions - admins can delete any order, users only their own
    if (userRole !== 'Admin' && order.userId !== userId) {
      throw new ForbiddenException('You can only delete your own orders');
    }
    // Delete order items first (due to foreign key constraints)
    await this.prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Delete the order
    const deletedOrder = await this.prisma.order.delete({
      where: { id },
    });
    this.invalidateUserOrderCache(order.userId);
    return deletedOrder;
  }

  async updateStatus(id: number, status: OrderStatus, userId: number, userRole: string){
    //check for orderId
    const order = await this.prisma.order.findUnique({where:{id},},);
    if(!order){throw new NotFoundException('Specified Order Not found');}
    if (userRole !== 'Admin') {
      throw new ForbiddenException('Only admins can update order status');
    }
    const updatedOrder = await this.prisma.order.update({
      where: {id},
      data:{status},
      include:{
        user: { select: { id: true, name: true, email: true, }, },
        orderItems: { include: { product: true, }, },
      }
    });
    this.invalidateUserOrderCache(order.userId);
    return updatedOrder;
  }

  private async invalidateUserOrderCache (userId: number): Promise<void>{
    try {
      await Promise.all([
        this.cacheManager.del('GET:/orders'),
        this.cacheManager.del(`GET:/users/${userId}/orders`),
      ]);
      this.logger.debug(`Cache invalidated for user ${userId}'s orders`);
    }catch (e) {
      this.logger.warn(`Cache invalidation failed: ${e.message}`, e.stack,);
    }
  }

}
