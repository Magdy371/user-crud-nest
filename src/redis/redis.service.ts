import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MongoService } from 'src/DB/mongo.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private redisClient: Redis;
    private readonly LOGS_CHANNEL = 'app-logs';
    private readonly LOGS_QUEUE = 'logs-queue';

    constructor(private service: MongoService){
        this.redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
        });
        
    }
    async onModuleInit() {
        await this.initLogConsumer();
        this.logger.log('Redis service initialized with log consumer');
    }
    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    async publishLog(logData: any): Promise<void>{
        try {
            await this.redisClient.publish(this.LOGS_CHANNEL, JSON.stringify(logData));
            await this.redisClient.lpush(this.LOGS_QUEUE, JSON.stringify(logData));
        } catch (e) {
            this.logger.error(`Failed to publish log to redis ${e.message}`);
        }
    }

    private async initLogConsumer() {
         // Subscribe to logs channel for real-time processing
        this.redisClient.subscribe(this.LOGS_CHANNEL,(err)=>{
            if(err){
                this.logger.error('Failed to subscribe to Redis channel', err);
            }else {
                this.logger.log(`Subscribed to Redis channel: ${this.LOGS_CHANNEL}`);
            }
        });
        //Process message from channel
        this.redisClient.on('message',async(channel, message)=>{
            if(channel === this.LOGS_CHANNEL){
                await this.processLogMessage(message);
            }
        });
        //Process existing log in the queue
        await this.processLogQueue();
    }

    private async processLogMessage(message: string){
        try{
            const logData = JSON.parse(message);
            await this.service.createLog(logData);
            this.logger.debug('Log saved to MongoDB via Redis');
        }catch (error){
            this.logger.error('Failed to process log message', error.message);
        }
    }

    private async processLogQueue(): Promise<void> {
        try {
            let logMessage: string | null;
            //Process to 100 log from the queue
            for(let i=0; i<100; i++){
                logMessage = await this.redisClient.rpop(this.LOGS_QUEUE);
                if(!logMessage)
                    break;
                await this.processLogMessage(logMessage);
            }
        } catch (error) {
            this.logger.error(`Failed to process log queue ${error.message}`);
        }
    }
}