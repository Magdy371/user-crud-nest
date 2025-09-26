import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoService } from './mongo.service';
import { Log, LogSchema } from './schemas/log.schema';
import { config } from 'dotenv';
config()

@Module({
    // Simplified, cleaner connection options
    imports: [ 
        MongooseModule.forRoot(process.env.MONGODB_URI!), 
        MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]), 
    ],
    providers: [ MongoService ],
    exports: [MongoService],
})
export class MongoModule {}