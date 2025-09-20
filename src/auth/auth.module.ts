import {Module} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService} from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserService } from '../user/user.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '../common/guards/auth.guard';


@Module({
  controllers: [AuthController, ],
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key', // Use environment variable
      signOptions: { expiresIn: '24h' }, // Token expires in 24 hours
    }),
  ],
  providers: [
    AuthService,],
})

export class AuthModule {}