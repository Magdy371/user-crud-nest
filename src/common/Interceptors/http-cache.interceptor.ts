import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected trackBy(context: ExecutionContext):string | undefined {
    const req = context.switchToHttp().getRequest();
    if(!req || (req.method !== 'GET' && req.method !== 'HEAD')){
      return undefined;
    }
    const urlBase = req.baseUrl ?? '';
    const path = req.path ?? '';
    const query = req.query || {};
    const qEntries = Object.keys(query)
      .sort().
      map((k) => `${k}=${Array.isArray(query[k]) ? query[k].join(',') : query[k]}`)
      .join('&');


    const key = `${req.method}:${urlBase}${path}${qEntries ? '?' + qEntries : ''}`;
    return key;
  }
}