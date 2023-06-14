import { Bitbucket } from 'bitbucket';
import type { CommitCacheContent } from './cache';
import { getCommitDiffCache, storeCommitDiffToCache } from './cache';
import type { DiffContentWithoutRaw } from '~/utils/types/diff';

export interface HTTPError extends Error {
  error: any | undefined;
  headers: Headers | undefined;
  request: any;
  status: number;
}

export async function getCommits({
  workspace,
  repo,
  branch,
  token,
  page
}: {
  workspace: string;
  repo: string;
  branch: string | undefined;
  token: string;
  page: string;
}) {
  const bitbucket = new Bitbucket({ auth: { token } });

  const response = await bitbucket.commits.list({
    repo_slug: repo,
    workspace,
    include: branch,
    pagelen: 10,
    page
  });
  const commits = response.data.values || [];

  const diffResults: Array<CommitCacheContent> = await Promise.all(
    commits.map(async (commit) => {
      const commitHash = commit.hash!;

      try {
        const cachedDiff = getCommitDiffCache({
          commitHash,
          repository: repo,
          workspace
        });
        if (cachedDiff) {
          return cachedDiff;
        }
      } catch (err) {
        // No-op.
      }

      const tmpDiff = await bitbucket.commits.getDiff({
        repo_slug: repo,
        workspace,
        spec: commitHash
      });
      const diffLines: string[] = tmpDiff.data.split('\n');
      const diffInfo = {
        additions: 0,
        deletions: 0
      };

      for (const line of diffLines) {
        if (line.startsWith('---') || line.startsWith('+++')) continue;

        if (line.startsWith('+')) {
          diffInfo.additions++;
        } else if (line.startsWith('-')) {
          diffInfo.deletions++;
        }
      }
      const diffData: CommitCacheContent['diff'] = {
        raw: tmpDiff.data,
        diffInfo,
        url: `https://bitbucket.org/${workspace}/${repo}/commits/${commit.hash}`,
        date: commit.date || '',
        message: commit.message || ''
      };

      return {
        commitHash,
        diff: diffData,
        repository: repo,
        workspace
      };
    })
  );

  const commitsWithDiff: Array<DiffContentWithoutRaw> = [];
  for (const diffResult of diffResults) {
    storeCommitDiffToCache(diffResult);

    const { raw: _raw, ...rest } = diffResult.diff;
    commitsWithDiff.push(rest);
  }

  return commitsWithDiff;
}
