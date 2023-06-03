import { LRUCache } from 'lru-cache';
import { nanoid } from 'nanoid';

import fs from 'fs';
import path from 'path';
import { CacheExpireError } from '../common/cache';

const options = {
  max: 500,

  // how long to live in ms
  ttl: 1000 * 60 * 60,

  // return stale items before removing from cache?
  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false
};

export interface CacheContent {
  accessToken: string;
  refreshToken: string;
}

const CACHE_FILE_PATH = path.join(process.cwd(), '.session-cache');

const tokensCache = new LRUCache<string, CacheContent>(options);
if (process.env.NODE_ENV === 'development') {
  let initialEntry: Array<[string, LRUCache.Entry<CacheContent>]> = [];
  if (fs.existsSync(CACHE_FILE_PATH)) {
    const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    initialEntry = JSON.parse(content);
  }

  tokensCache.load(initialEntry);
}

export function getTokensBySessionId(sessionId: string) {
  const tokens = tokensCache.get(sessionId);
  if (!tokens) {
    throw new CacheExpireError(`cache expired`);
  }

  return tokens;
}

export function generateSessionId(tokens: CacheContent) {
  const id = nanoid();
  tokensCache.set(id, tokens);
  fs.writeFileSync(
    CACHE_FILE_PATH,
    JSON.stringify(tokensCache.dump(), null, 2),
    'utf-8'
  );

  return id;
}
