import { Injectable, Inject, Logger, NestInterceptor, ExecutionContext, CallHandler, } from '@nestjs/common';
import { Reflector } from '@nestjs/core'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { IS_PUBLIC_KEY } from '../guards/decorators/auth.decorators'
import { CACHEABLE_KEY } from '../guards/decorators/cacheable.decorator';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(HttpCacheInterceptor.name);
  private readonly defaultTTL: number = Number(process.env.CACHE_TTL_DEFAULT?? 60);
  constructor(@Inject(CACHE_MANAGER) private cacheManger: Cache, private reflecotr: Reflector) {
  }
  async intercept(context: ExecutionContext, next: CallHandler){
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const method: string = request.method ?? 'GET';
    const originalUrl: string = request.originalUrl ?? request.url ?? '/';

    if(method !== 'GET'){
      return lastValueFrom(next.handle());
    }

    //check if route handler is Public
    const isPublic = this.reflecotr.getAllAndOverride(
      IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]
    );
    //check if route handler is Public
    const isCachable = this.reflecotr.getAllAndOverride<{ttl?: number} | boolean>(
      CACHEABLE_KEY, [context.getHandler(), context.getClass()]
    );
    if(!isPublic && !isCachable){
      return lastValueFrom(next.handle());
    }

    if(request.header?.authorization && !isCachable){
      return lastValueFrom(next.handle());
    }

    let ttl = this.defaultTTL;
    if(isCachable && typeof isCachable === 'object' && isCachable.ttl){
      ttl = isCachable.ttl;
    }

    //Building Cache keys
    const userId = request.user?.id;
    const includeUser = Boolean(userId && isCachable);
    const checkBaseKey = `${method}:${originalUrl}`;
    const cacheKey = includeUser ? `${checkBaseKey}:user:${userId}` : checkBaseKey;

    try{
      //get from bash
      const cached = await this.cacheManger.get(cacheKey);
      if(cached !== undefined && cached !== null){
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }
    }catch (e) {
      this.logger.warn(`Cache get error for ${cacheKey}: ${e.message}`);
    }

    //if not cached then we cache it
    const response = await lastValueFrom(next.handle());
     try{
       await this.cacheManger.set(cacheKey, response, ttl * 1000)
       this.logger.debug(`Cache set for ${cacheKey} with ttl ${ttl}s`)
     }catch (e) {
       this.logger.warn(`Cache set error for ${cacheKey}: ${e.message}`)
     }
     return response;
  }
}