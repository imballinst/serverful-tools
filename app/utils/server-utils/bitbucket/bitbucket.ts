import { Bitbucket } from 'bitbucket';
import { getCommitDiffCache, storeCommitDiffToCache } from './cache';

const REPO_SLUG = 'test-repo';
const WORKSPACE = 'imballinst2';

export async function getCommits(token: string) {
  let bitbucket = new Bitbucket({ auth: { token } });
  let diff: any = [];

  try {
    const response = await bitbucket.commits.list({
      repo_slug: REPO_SLUG,
      workspace: WORKSPACE
    });
    const commits = response.data.values || [];

    for (const commit of commits) {
      if (!commit.hash) continue;

      try {
        const cachedDiff = await getCommitDiffCache({
          commitHash: commit.hash,
          repository: REPO_SLUG,
          workspace: WORKSPACE
        });
        if (cachedDiff) {
          diff.push(cachedDiff);
          continue;
        }
      } catch (err) {
        // No-op.
      }

      const tmpDiff = await bitbucket.commits.getDiff({
        repo_slug: REPO_SLUG,
        workspace: WORKSPACE,
        spec: commit.hash
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
      const diffData = {
        raw: tmpDiff.data,
        diffInfo,
        url: `https://bitbucket.org/${WORKSPACE}/${REPO_SLUG}/commits/${commit.hash}`,
        date: commit.date,
        message: commit.message
      };

      storeCommitDiffToCache({
        commitHash: commit.hash,
        diff: diffData,
        repository: REPO_SLUG,
        workspace: WORKSPACE
      });
      diff.push(diffData);
    }

    return {
      diff
    };
  } catch (err) {
    console.error(err);
  }

  return diff;
}
