import { Bitbucket } from 'bitbucket';

const REPO_SLUG = 'experiments';
const REPOSITORY = 'test-repo';

export async function getCommits(token: string) {
  let bitbucket = new Bitbucket({ auth: { token } });

  const response = await bitbucket.commits.list({
    repo_slug: REPO_SLUG,
    workspace: REPOSITORY
  });
  const diff = await bitbucket.commits.getDiff({
    repo_slug: REPO_SLUG,
    workspace: REPOSITORY,
    spec: response.data.values?.[0]?.hash || ''
  });

  return diff;
}
