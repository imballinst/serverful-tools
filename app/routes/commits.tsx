import { useEffect, useState } from 'react';

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

  return (
    <main>
      <h2>Commits</h2>

      <pre>{JSON.stringify(commits, null, 2)}</pre>
    </main>
  );
}
