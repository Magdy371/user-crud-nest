/* eslint-disable prettier/prettier */
import { PrismaModule } from './prisma/prisma.module';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module'
import { ProductModule } from './product/product.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware'
import { AuthModule } from './auth/auth.module';
import { GlobalExceptionFilter } from './common/filters/all-exceptions.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard} from './common/guards/roles.guard';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager' //to enable in memory cache
import { HttpCacheInterceptor } from './common/Interceptors/http-cache.interceptor';

@Module({
  imports: [UserModule, PrismaModule, AuthModule, CategoryModule, ProductModule, CacheModule.register(
    {
      isGlobal: true,
      ttl: Number(process.env.CACHE_TTL_DEFAULT ?? 60),
    }
  )],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Global authentication guard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
   {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter, // Global exception filter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
    configure(consumer:MiddlewareConsumer){
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
