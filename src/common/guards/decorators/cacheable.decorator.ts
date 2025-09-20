// common/guards/decorators/cacheable.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const CACHEABLE_KEY = 'cacheable';

// named export that returns a decorator function (factory)
export const Cachable = (opts?: { ttl?: number }) => SetMetadata(CACHEABLE_KEY, opts ?? true);
