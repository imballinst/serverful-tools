import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  accessTokenCookie,
  refreshTokenCookie
} from '~/utils/server-utils/cookies/cookies';

export const loader: LoaderFunction = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');

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

  const content = await response.json();
  if (!response.ok)
    throw new Error(content?.error_description || response.statusText);

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    await accessTokenCookie.serialize(content.access_token)
  );
  headers.append(
    'Set-Cookie',
    await refreshTokenCookie.serialize(content.refresh_token)
  );

  return redirect('/', {
    headers
  });
};

// Helper functions.
function toBase64(str: string) {
  return Buffer.from(str).toString('base64');
}
