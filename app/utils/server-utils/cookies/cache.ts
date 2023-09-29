import { LRUCache } from 'lru-cache';
import { nanoid } from 'nanoid';

import fs from 'fs';
import path from 'path';
import { CACHE_OPTIONS, CacheExpireError } from '../common/cache';

export interface CacheContent {
  accessToken: string;
  gitlabToken: string;
}

const CACHE_FILE_PATH = path.join(process.cwd(), '.session-cache');
const tokensCache = new LRUCache<string, CacheContent>(CACHE_OPTIONS);

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

  if (process.env.NODE_ENV === 'development') {
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(tokensCache.dump(), null, 2),
      'utf-8'
    );
  }

  return id;
}
