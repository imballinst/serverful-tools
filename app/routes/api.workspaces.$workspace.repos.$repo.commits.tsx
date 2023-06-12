import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getCommits } from '~/utils/server-utils/bitbucket/bitbucket';
import { CacheExpireError } from '~/utils/server-utils/common/cache';
import { getTokensBySessionId } from '~/utils/server-utils/cookies/cache';
import { sessionIdCookie } from '~/utils/server-utils/cookies/cookies';

export const loader: LoaderFunction = async ({ request, params }) => {
  const { workspace, repo } = params;
  const { searchParams } = new URL(request.url);
  let sessionId = '';

  try {
    if (!workspace || !repo) {
      throw new Error('The workspace and repo param must be defined.');
    }

    sessionId = await sessionIdCookie.parse(request.headers.get('cookie'));
    let accessToken = '';

    if (!sessionId) {
      sessionId = request.headers.get('x-session-id') || '';
    }

    accessToken = getTokensBySessionId(sessionId).accessToken;
    if (!accessToken) return json({}, { status: 401 });

    const commits = await getCommits({
      workspace,
      repo,
      token: accessToken,
      page: searchParams.get('page') || '1'
    });
    return json({ commits });
  } catch (err) {
    if (err instanceof CacheExpireError) {
      if (!sessionId) {
        return json(
          { code: '10000', message: 'unauthorized' },
          {
            status: 401
          }
        );
      }

      return json(
        { code: '10001', message: 'session expired' },
        {
          status: 401,
          headers: {
            'set-cookie': await sessionIdCookie.serialize('', {
              expires: new Date(0)
            })
          }
        }
      );
    }

    return json({ code: 'unknown', message: (err as Error).message });
  }
};
