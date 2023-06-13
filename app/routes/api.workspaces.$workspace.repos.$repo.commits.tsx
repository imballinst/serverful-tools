import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import type { HTTPError } from '~/utils/server-utils/bitbucket/bitbucket';
import { getCommits } from '~/utils/server-utils/bitbucket/bitbucket';
import { CacheExpireError } from '~/utils/server-utils/common/cache';
import { getTokensBySessionId } from '~/utils/server-utils/cookies/cache';
import { sessionIdCookie } from '~/utils/server-utils/cookies/cookies';
import { ErrorCodes, ErrorMessages } from '~/utils/types/error-codes';

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
    if (!accessToken) throw new CacheExpireError();

    const commits = await getCommits({
      workspace,
      repo,
      token: accessToken,
      page: searchParams.get('page') || '1'
    });
    return json({ commits });
  } catch (err) {
    const httpError = err as HTTPError;

    if (err instanceof CacheExpireError) {
      if (!sessionId) {
        return json(
          {
            code: ErrorCodes.UNAUTHENTICATED,
            message: ErrorMessages[ErrorCodes.UNAUTHENTICATED].toLowerCase()
          },
          {
            status: 401
          }
        );
      }

      return json(
        {
          code: ErrorCodes.SESSION_EXPIRED,
          message: ErrorMessages[ErrorCodes.SESSION_EXPIRED].toLowerCase()
        },
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

    if (httpError.error?.error?.message) {
      if (httpError.error?.error?.message.includes('Token is invalid')) {
        return json(
          {
            code: ErrorCodes.TOKEN_IS_INVALID,
            message: ErrorMessages[ErrorCodes.TOKEN_IS_INVALID].toLowerCase()
          },
          {
            status: 403,
            headers: {
              'set-cookie': await sessionIdCookie.serialize('', {
                expires: new Date(0)
              })
            }
          }
        );
      }
    }

    return json({
      code: ErrorCodes.UNKNOWN_ERROR,
      message: `${ErrorMessages[ErrorCodes.UNKNOWN_ERROR]}: ${
        (err as Error).message
      }`
    });
  }
};
