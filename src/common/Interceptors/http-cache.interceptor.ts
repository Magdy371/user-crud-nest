import { Injectable, Inject, Logger } from '@nestjs/common';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Public } from '../guards/decorators/auth.decorators';
import { CACHEABLE_KEY } from '../guards/decorators/cacheable.decorator';


@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);
  private readonly defaultTtl = Number(process.env.CACHE_TTL_DEFAULT ?? 60);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const method: string = request.method ?? 'GET';
    const originalUrl: string = request.originalUrl ?? request.url ?? '/';

    // Cache GET methods only
    if (method !== 'GET') {
      return next.handle();
    }

    // Check if route is cacheable
    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    const explicitCachable = this.reflector.getAllAndOverride<{ ttl?: number } | boolean>(
      CACHEABLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isPublic && !explicitCachable) {
      return next.handle();
    }

    // Skip caching requests with Authorization header unless explicitly cacheable
    if (request.headers?.authorization && !explicitCachable) {
      return next.handle();
    }

    // Determine TTL
    let ttl = this.defaultTtl;
    if (explicitCachable && typeof explicitCachable === 'object' && explicitCachable.ttl) {
      ttl = explicitCachable.ttl;
    }

    // Build cache key
    const userId = request.user?.id;
    const includeUser = Boolean(userId && explicitCachable);
    const cacheKeyBase = `${method}:${originalUrl}`;
    const cacheKey = includeUser ? `${cacheKeyBase}:user:${userId}` : cacheKeyBase;

    return new Observable((subscriber) => {
      // Try to get cached response first
      this.cacheManager.get(cacheKey)
        .then((cached) => {
          if (cached !== undefined && cached !== null) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            subscriber.next(cached);
            subscriber.complete();
            return;
          }

          // Not cached, proceed with the request
          next.handle().pipe(
            tap((response) => {
              // Cache the response
              this.cacheManager.set(cacheKey, response, ttl * 1000) // Convert to milliseconds
                .catch((err) => {
                  this.logger.warn(`Cache set error for ${cacheKey}: ${err.message}`);
                });
              this.logger.debug(`Cache set for ${cacheKey} with TTL ${ttl}s`);
            })
          ).subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch((err) => {
          this.logger.warn(`Cache get error for ${cacheKey}: ${err.message}`);
          // If cache read fails, proceed with the request
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
    });
  }
}