import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { generateSessionId } from '~/utils/server-utils/cookies/cache';
import {
  getCookieExpires,
  sessionIdCookie
} from '~/utils/server-utils/cookies/cookies';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const token = formData.get('token')?.toString();
  const tokenType = formData.get('tokenType')?.toString() || 'bitbucket';

  if (!token) {
    return json({}, { status: 400 });
  }

  const sessionId = generateSessionId({
    accessToken: tokenType === 'bitbucket' ? token : '',
    gitlabToken: tokenType === 'gitlab' ? token : ''
  });

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    await sessionIdCookie.serialize(sessionId, { expires: getCookieExpires() })
  );

  return json(
    {
      sessionId
    },
    {
      headers
    }
  );
};
