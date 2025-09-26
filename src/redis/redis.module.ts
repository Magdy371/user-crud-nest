import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MongoModule } from '../DB/mongo.module';

@Module({
  imports: [MongoModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}