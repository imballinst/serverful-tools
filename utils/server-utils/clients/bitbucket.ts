import { Bitbucket } from 'bitbucket';

let bitbucket = new Bitbucket({});

export function setAccessToken(token: string) {
  bitbucket = new Bitbucket({ auth: { token } });
}

export async function getCommits() {
  const response = await bitbucket.commits.list({
    repo_slug: '',
    workspace: ''
  });
  const commit = await bitbucket.commits.getDiff({
    repo_slug: '',
    workspace: '',
    spec: response.data.values?.[0]?.hash || ''
  });
}
