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
