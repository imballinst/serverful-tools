import { LRUCache } from 'lru-cache';

export const cache = new LRUCache<any, any>({
  max: 500,
  allowStale: false
});
