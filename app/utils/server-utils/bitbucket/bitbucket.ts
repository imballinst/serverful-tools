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
      const cachedDiff = await getCommitDiffCache(commit.hash);

      if (cachedDiff) {
        diff.push(cachedDiff);
        continue;
      }

      const tmpDiff = await bitbucket.commits.getDiff({
        repo_slug: REPO_SLUG,
        workspace: WORKSPACE,
        spec: commit.hash
      });
      storeCommitDiffToCache(tmpDiff);
    }

    return {
      diff
    };
  } catch (err) {
    console.error(err);
  }

  return diff;
}
