import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getCommits } from '~/utils/server-utils/clients/bitbucket';
import { accessTokenCookie } from '~/utils/server-utils/cookies/cookies';

export const loader: LoaderFunction = async ({ request }) => {
  const accessToken = await accessTokenCookie.parse(
    request.headers.get('cookie')
  );
  console.info('accessToken', accessToken, request.headers.keys());
  if (!accessToken) return json({}, { status: 401 });

  const commits = getCommits(accessToken);

  return json({ commits });
};
