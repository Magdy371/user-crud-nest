import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MongoService } from 'src/DB/mongo.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private redisClient: Redis;
    private readonly LOGS_QUEUE = 'logs-queue';

    constructor(private service: MongoService){
        this.redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        });
    }

    async onModuleInit() {
        setInterval(() => this.processLogQueue(), 10000);
        await this.processLogQueue();
        this.logger.log('Redis service initialized with log consumer');
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    async publishLog(logData: any): Promise<void>{
        try {
            await this.redisClient.lpush(this.LOGS_QUEUE, JSON.stringify(logData));
        } catch (e) {
            this.logger.error(`Failed to publish log to redis ${e.message}`);
        }
    }

    // private async processLogQueue(): Promise<void> {
    //     try {
    //         while (true) {
    //             const result = await this.redisClient.brpop(this.LOGS_QUEUE, 0);
                
    //             if (result) {
    //                 const logData = JSON.parse(result[1]);
    //                 await this.service.createLog(logData);
    //                 this.logger.debug('Log saved to MongoDB via Redis Queue');
    //             }
    //         }
    //     } catch (error) {
    //         this.logger.error('Failed to process log queue', error);
    //     }
    // }

    private async processLogQueue(): Promise<void> {
        try {
            let logMessage: string | null;
            
            // Process up to 100 logs from the queue
            for (let i = 0; i < 100; i++) {
                logMessage = await this.redisClient.rpop(this.LOGS_QUEUE);
                if (!logMessage) break;
                
                const logData = JSON.parse(logMessage);  // Fixed variable name
                await this.service.createLog(logData);
                this.logger.debug('Log saved to MongoDB via Redis');
            }
        } catch (error) {
            this.logger.error('Failed to process log queue', error);
        }
    }
}