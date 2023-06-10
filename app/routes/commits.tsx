import { useEffect, useState } from 'react';
import { Form } from '@remix-run/react';

export default function Commits() {
  const [commits, setCommits] = useState<any>(null);

  useEffect(() => {
    async function fetchCommits() {
      const sessionId = window.localStorage.getItem('sessionId');
      if (!sessionId) return;

      const response = await fetch('/api/commits', {
        headers: {
          'x-session-id': sessionId
        }
      });
      const json = await response.json();
      setCommits(json.commits);
    }

    fetchCommits();
  }, []);

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
    <main>
      <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
        <h1>Welcome to Remix</h1>

        <Form action="/api/authorize" method="post" onSubmit={onSubmit}>
          <input type="text" name="token" />

          <button type="submit">Authorize</button>
        </Form>
      </div>

      <h2>Commits</h2>

      <table>
        <thead>
          <tr>
            <th>Commit link</th>
            <th>Commit title</th>
            <th>Commit date</th>
            <th>Number of lines changed</th>
          </tr>
        </thead>
        <tbody>
          {commits &&
            commits.diff.map((diffData: any, idx: number) => (
              <tr key={idx}>
                <td>{diffData.url}</td>
                <td>{diffData.message}</td>
                <td>{diffData.date}</td>
                <td>
                  {diffData.diffInfo.additions + diffData.diffInfo.deletions} (+
                  {diffData.diffInfo.additions}, -{diffData.diffInfo.deletions})
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
