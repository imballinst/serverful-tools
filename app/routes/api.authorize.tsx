import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { generateSessionId } from '~/utils/server-utils/cookies/cache';
import { sessionIdCookie } from '~/utils/server-utils/cookies/cookies';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const token = formData.get('token')?.toString();

  if (!token) {
    return json({}, { status: 400 });
  }

  const sessionId = generateSessionId({
    accessToken: token
  });

  const headers = new Headers();
  headers.append('Set-Cookie', await sessionIdCookie.serialize(sessionId));

  return json(
    {
      sessionId
    },
    {
      headers
    }
  );
};
