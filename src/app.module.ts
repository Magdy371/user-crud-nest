/* eslint-disable prettier/prettier */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware'
import { AuthModule } from './auth/auth.module';
import { GlobalExceptionFilter } from './common/filters/all-exceptions.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

@Module({
  imports: [UserModule, PrismaModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Global authentication guard
    },
   /*
   *  {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter, // Global exception filter
    },*/
  ],
})
export class AppModule implements NestModule {
    configure(consumer:MiddlewareConsumer){
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
