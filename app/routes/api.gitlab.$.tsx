import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import axios from 'axios';
import type { HTTPError } from '~/utils/server-utils/bitbucket/bitbucket';
import { CacheExpireError } from '~/utils/server-utils/common/cache';
import { getTokensBySessionId } from '~/utils/server-utils/cookies/cache';
import { sessionIdCookie } from '~/utils/server-utils/cookies/cookies';
import { ErrorCodes, ErrorMessages } from '~/utils/types/error-codes';

export const loader: LoaderFunction = async ({ request, params }) => {
  const gitlabApiPath = params['*'];
  const { searchParams } = new URL(request.url);
  let sessionId = '';

  try {
    if (!gitlabApiPath) {
      throw new Error('The gitlabApiPath param must be defined.');
    }

    sessionId = await sessionIdCookie.parse(request.headers.get('cookie'));
    let gitlabToken = '';

    if (!sessionId) {
      sessionId = request.headers.get('x-session-id') || '';
    }

    gitlabToken = getTokensBySessionId(sessionId).gitlabToken;
    if (!gitlabToken) throw new CacheExpireError();

    const projectPath = gitlabApiPath.split('/').slice(0, -1).join('/');
    const apiPath = gitlabApiPath.split('/').slice(-1).join('/');

    const { page, ...pipelineVariablesToFilter } =
      Object.fromEntries(searchParams);
    const { data: pipelines } = await axios(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(
        projectPath
      )}/${apiPath}?page=${page}`,
      {
        headers: {
          'PRIVATE-TOKEN': gitlabToken
        }
      }
    );

    const pipelinesVariables = await Promise.all(
      pipelines.map((item: any) =>
        axios(
          `https://gitlab.com/api/v4/projects/${item.project_id}/pipelines/${item.id}/variables`,
          {
            headers: {
              'PRIVATE-TOKEN': gitlabToken
            }
          }
        )
      )
    );

    const result: any[] = [];

    for (let i = 0; i < pipelines.length; i++) {
      const pipelineVariables = pipelinesVariables[i].data;
      if (pipelineVariables.length === 0) continue

      const isIncluded = pipelineVariables.every((variable: any) => {
        const { key, value } = variable;
        if (!pipelineVariablesToFilter[key]) return true;

        return pipelineVariablesToFilter[key] === value;
      });

      if (!isIncluded) continue;
      result.push({ ...pipelines[i], variables: pipelineVariables });
    }

    return json(result);
  } catch (err) {
    console.error(err);
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

    return json(
      {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: `${ErrorMessages[ErrorCodes.UNKNOWN_ERROR]}: ${
          (err as Error).message
        }`
      },
      {
        status: 500
      }
    );
  }
};
