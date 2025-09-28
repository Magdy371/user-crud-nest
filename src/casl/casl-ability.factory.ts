import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility, ExtractSubjectType } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { User, Role, Product, Category, Order, OrderItem } from '@prisma/client';

type AppSubjects = Subjects<{
  User: User;
  Role: Role;
  Product: Product;
  Category: Category;
  Order: Order;
  OrderItem: OrderItem;
}> | 'all';

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User & { role: { name: string } }) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    if (user.role.name === 'Admin') {
      // Admin can manage everything
      can('manage', 'all');
    } else if (user.role.name === 'Customer') {
      // Users can read their own profile
      can('read', 'User', { id: user.id });
      can('update', 'User', { id: user.id });

      // Users can read products and categories
      can('read', 'Product');
      can('read', 'Category');

      // Users can manage their own orders
      can('manage', 'Order', { userId: user.id });
      can('read', 'Order', { userId: user.id });
      can('create', 'Order');
      can('update', 'Order', { userId: user.id });
      can('delete', 'Order', { userId: user.id });
    }

    //detrmine "subject" of permission check
    return build({
      detectSubjectType: (item) =>
        item.constructor.name as ExtractSubjectType<AppSubjects>,
    });
  }
}