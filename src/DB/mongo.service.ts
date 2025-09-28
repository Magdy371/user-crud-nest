import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from './schemas/log.schema';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private log = new Logger(MongoService.name)
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  async onModuleInit(){
    this.log.debug('MongoService Destroyed');
  }
  async onModuleDestroy(){
    this.log.debug( 'Mongo db service destroyed');
  }
  async createLog ( logData: Partial<Log>): Promise<Log>{
    const log = new this.logModel(logData);
    return await log.save();
  }

  async getLogs (limit=100): Promise<Log[]>{
    return await this.logModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}