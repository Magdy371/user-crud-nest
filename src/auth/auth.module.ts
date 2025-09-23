import {Module} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService} from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

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