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
      storeCommitDiffToCache({
        commitHash: commit.hash,
        diff: tmpDiff,
        repository: REPO_SLUG,
        workspace: WORKSPACE
      });
      diff.push(tmpDiff);
    }

    return {
      diff
    };
  } catch (err) {
    console.error(err);
  }

  return diff;
}
