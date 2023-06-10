export class CacheExpireError extends Error {}

export const CACHE_OPTIONS = {
  max: 500,

  // how long to live in ms
  ttl: 1000 * 60 * 60,

  // return stale items before removing from cache?
  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false
};
