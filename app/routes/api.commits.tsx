import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getCommits } from '~/utils/server-utils/bitbucket/bitbucket';
import { getTokensBySessionId } from '~/utils/server-utils/cookies/cache';
import { accessTokenCookie } from '~/utils/server-utils/cookies/cookies';

export const loader: LoaderFunction = async ({ request }) => {
  let accessToken: string = await accessTokenCookie.parse(
    request.headers.get('cookie')
  );

  if (!accessToken) {
    const sessionId = request.headers.get('x-session-id') || '';
    accessToken = getTokensBySessionId(sessionId).accessToken;
  }

  if (!accessToken) return json({}, { status: 401 });

  const commits = await getCommits(accessToken);
  console.info(commits);
  return json({ commits });
};
