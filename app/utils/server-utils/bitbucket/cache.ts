import { LRUCache } from 'lru-cache';

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

export type CommitCacheContent = any;

const CACHE_FILE_PATH = path.join(process.cwd(), '.commit-cache');

const commitsCache = new LRUCache<string, CommitCacheContent>(options);
if (process.env.NODE_ENV === 'development') {
  let initialEntry: Array<[string, LRUCache.Entry<CommitCacheContent>]> = [];
  if (fs.existsSync(CACHE_FILE_PATH)) {
    const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    initialEntry = JSON.parse(content);
  }

  commitsCache.load(initialEntry);
}

export function getCommitDiffCache(commitHash: string) {
  const diff = commitsCache.get(commitHash);
  if (!diff) {
    throw new CacheExpireError(`cache expired`);
  }

  return diff;
}

export function storeCommitDiffToCache(commit: CommitCacheContent) {
  commitsCache.set(commit.hash, commit);
  fs.writeFileSync(
    CACHE_FILE_PATH,
    JSON.stringify(commitsCache.dump(), null, 2),
    'utf-8'
  );

  return commit.hash;
}
