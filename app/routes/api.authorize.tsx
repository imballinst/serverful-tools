import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { generateSessionId } from '~/utils/server-utils/cookies/cache';
import {
  accessTokenCookie,
  refreshTokenCookie
} from '~/utils/server-utils/cookies/cookies';

export const action: ActionFunction = async ({ request }) => {
  const bodyContent = await request.json();
  const code = bodyContent.code;

  if (!code) {
    return json({}, { status: 400 });
  }

  const response = await fetch(
    `https://bitbucket.org/site/oauth2/access_token`,
    // `https://bitbucket.org/site/oauth2/access_token?grant_type=authorization_code&code=${code}`,
    {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${toBase64(
          `${process.env.BB_OAUTH_CONSUMER_KEY}:${process.env.BB_OAUTH_CONSUMER_SECRET}`
        )}`
      },
      body: `grant_type=authorization_code&code=${code}`
    }
  );

  if (!response.ok) throw new Error(response.statusText);

  const content = await response.json();

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    await accessTokenCookie.serialize(content.access_token)
  );
  headers.append(
    'Set-Cookie',
    await refreshTokenCookie.serialize(content.refresh_token)
  );

  const sessionId = generateSessionId({
    accessToken: content.access_token,
    refreshToken: content.refresh_token
  });

  return json({
    sessionId
  });
};

// Helper functions.
function toBase64(str: string) {
  return Buffer.from(str).toString('base64');
}
