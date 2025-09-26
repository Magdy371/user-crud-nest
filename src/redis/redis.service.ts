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

    private async initLogConsumer(): Promise<void> { {
    // Create a separate client for subscriptions
        const subscribeClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        });

        // Subscribe to logs channel for real-time processing
        subscribeClient.subscribe(this.LOGS_CHANNEL, (err) => {
            if (err) {
                this.logger.error('Failed to subscribe to logs channel', err);
            } else {
                this.logger.log(`Subscribed to ${this.LOGS_CHANNEL} channel`);
            }
        });

        // Process messages from channel
        subscribeClient.on('message', async (channel, message) => {
            if (channel === this.LOGS_CHANNEL) {
                await this.processLogMessage(message);
            }
        });

        // Process existing logs in queue using main client (not in subscribe mode)
        await this.processLogQueue();

        // Handle cleanup
        subscribeClient.on('end', () => {
            this.logger.log('Redis subscribe client disconnected');
        });
        }
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
            
            // Process up to 100 logs from the queue
            for (let i = 0; i < 100; i++) {
                logMessage = await this.redisClient.rpop(this.LOGS_QUEUE);
                if (!logMessage) break;
                
                await this.processLogMessage(logMessage);
            }
        } catch (error) {
            this.logger.error('Failed to process log queue', error);
        }
    }
}