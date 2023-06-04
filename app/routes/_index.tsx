import type { V2_MetaFunction } from '@remix-run/node';
import { Form } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }];
};

export default function Index() {
  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const { action, method } = e.currentTarget;
    const formData = new FormData(e.currentTarget);

    const response = await fetch(action, {
      method,
      body: formData
    });
    const json = await response.json();

    window.localStorage.setItem('sessionId', json.sessionId);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Welcome to Remix</h1>

      <Form action="/api/authorize" method="post" onSubmit={onSubmit}>
        <input type="text" name="token" />

        <button type="submit">Authorize</button>
      </Form>
    </div>
  );
}
