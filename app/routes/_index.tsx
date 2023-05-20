import type { LoaderFunction, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }];
};

export const loader: LoaderFunction = () => {
  return json({ clientId: process.env.BB_OAUTH_CONSUMER_KEY });
};

export default function Index() {
  const { clientId } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Welcome to Remix</h1>
      <a
        href={`https://bitbucket.org/site/oauth2/authorize?client_id=${clientId}&response_type=code`}
      >
        Authorize
      </a>
    </div>
  );
}
