import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getCommits } from '~/utils/server-utils/bitbucket/bitbucket';
import { getTokensBySessionId } from '~/utils/server-utils/cookies/cache';
import { sessionIdCookie } from '~/utils/server-utils/cookies/cookies';

export const loader: LoaderFunction = async ({ request }) => {
  let sessionId: string = await sessionIdCookie.parse(
    request.headers.get('cookie')
  );
  let accessToken = '';

  if (!sessionId) {
    sessionId = request.headers.get('x-session-id') || '';
  }

  accessToken = getTokensBySessionId(sessionId).accessToken;
  if (!accessToken) return json({}, { status: 401 });

  const commits = await getCommits(accessToken);
  return json({ commits });
};
