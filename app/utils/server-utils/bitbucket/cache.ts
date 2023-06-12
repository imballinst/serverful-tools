import { LRUCache } from 'lru-cache';

import fs from 'fs';
import path from 'path';
import { CACHE_OPTIONS, CacheExpireError } from '../common/cache';
import { DiffContent } from '~/utils/types/diff';

export interface CommitCacheContent {
  commitHash: string;
  diff: DiffContent;
  repository: string;
  workspace: string;
}

const CACHE_FILE_PATH = path.join(process.cwd(), '.commit-cache');

const commitsCache = new LRUCache<string, CommitCacheContent>(CACHE_OPTIONS);
if (process.env.NODE_ENV === 'development') {
  let initialEntry: Array<[string, LRUCache.Entry<CommitCacheContent>]> = [];
  if (fs.existsSync(CACHE_FILE_PATH)) {
    const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    initialEntry = JSON.parse(content);
  }

  commitsCache.load(initialEntry);
}

export function getCommitDiffCache({
  commitHash,
  repository,
  workspace
}: {
  workspace: string;
  repository: string;
  commitHash: string;
}) {
  const diff = commitsCache.get(getKey({ commitHash, repository, workspace }));
  if (!diff) {
    throw new CacheExpireError(`cache expired`);
  }

  return diff;
}

export function storeCommitDiffToCache({
  commitHash,
  diff,
  repository,
  workspace
}: CommitCacheContent) {
  const key = getKey({ commitHash, repository, workspace });
  commitsCache.set(key, {
    commitHash,
    diff,
    repository,
    workspace
  });

  if (process.env.NODE_ENV === 'development') {
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(commitsCache.dump(), null, 2),
      'utf-8'
    );
  }

  return key;
}

// Key helpers.
function getKey({
  commitHash,
  repository,
  workspace
}: {
  workspace: string;
  repository: string;
  commitHash: string;
}) {
  return `${workspace}:${repository}:${commitHash}`;
}
