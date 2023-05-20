import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return json({}, { status: 400 });
  }
  console.info({
    grant_type: 'authorization_code',
    code: code
  });
  const response = await fetch(
    `https://bitbucket.org/site/oauth2/access_token`,
    {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${toBase64(
          `${process.env.BB_OAUTH_CONSUMER_KEY}:${process.env.BB_OAUTH_CONSUMER_SECRET}`
        )}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code
      })
    }
  );

  const content = await response.json();
  console.info(content);
  if (!response.ok) throw new Error('response error');

  return redirect('/');
};

// Helper functions.
function toBase64(str: string) {
  return Buffer.from(str).toString('base64');
}
