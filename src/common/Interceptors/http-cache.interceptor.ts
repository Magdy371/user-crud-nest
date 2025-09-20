import { Injectable, Inject, Logger } from '@nestjs/common';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Public } from '../guards/decorators/auth.decorators';
import { Cachable } from '../guards/decorators/cacheable.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Cache is a type-only import
    private reflector: Reflector,
  ) {}

  // Note: method name must be `intercept` (lowercase)
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const method: string = request.method ?? 'GET';
    const originalUrl: string = request.originalUrl ?? request.url ?? '/';
    const defaultTtl = Number(process.env.CACHE_TTL_DEFAULT ?? 60);

    // Cache GET methods only
    if (method !== 'GET') {
      return next.handle();
    }

    // Skip caching requests with Authorization header unless explicitly cacheable
    if (request.headers?.authorization) {
      const isCachable = this.reflector.getAllAndOverride<
        { ttl?: number } | boolean
      >(Cachable, [context.getHandler(), context.getClass()]);
      if (!isCachable) {
        return next.handle();
      }
    }

    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);
    const explicitCachable = this.reflector.getAllAndOverride(Cachable, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic && !explicitCachable) {
      return next.handle();
    }

    // Build cache key.
    const userId = request.user?.id;
    const includeUser = Boolean(userId && explicitCachable);
    const cacheKeyBase = `${method}:${originalUrl}`;
    const cacheKey = includeUser ? `${cacheKeyBase}:user:${userId}` : cacheKeyBase;

    /**
     * read cache (async)
     *     f cached result is found, return Observable.of(cached).
     *     therwise proceed to call handler and set cache.
     *     **/
    const cachedPromise = this.cacheManager
      .get(cacheKey)
      .then((cached)=>{
        if(cached !== undefined && cached !== null){
          this.logger.debug(`Cache hit for ${cacheKey}`);
          return cached;
        }
        return null
      }).catch((err)=>{
        this.logger.warn(`error readind cache key ${cacheKey}: errorCauese: ${err.message}`);
        return null;
      });

    //next.handle() returns Observable; we use Promise.resolve to check cache first
    return new Observable((subscriber) => {
      // check cache
      cachedPromise.then((cached) => {
        if (cached !== null) {
          subscriber.next(cached);//emit that value
          subscriber.complete();
          return;
        }

        // Not cached -> subscribe to original handler
        //const ttl: number = typeof explicitCachable === 'object' && explicitCachable?.ttl
           // ? explicitCachable.ttl : defaultTtl;

        const sub = next
          .handle().pipe(tap((responseBody) => {
              try {
                // don't await here; handle errors via catch
                (this.cacheManager.set as any)(
                  cacheKey, responseBody,)
                  .catch((err: any) => {
                  this.logger.warn(
                    `Cache write error for ${cacheKey}: ${err?.message ?? err}`,);
                  });
                this.logger.debug(`Cache SET for ${cacheKey}`);
              } catch (err) {
                this.logger.warn(
                  `Cache write error for ${cacheKey}: ${err?.message ?? err}`,);
                }
          }),)
          .subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });

        // cleanup
        return () => sub.unsubscribe();
      });
    });
  }
}
