import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';

export default function Authorize() {
  const navigate = useNavigate();

  useEffect(() => {
    async function exchange() {
      const searchParams = new URL(window.location.href).searchParams;
      const code = searchParams.get('code');

      const response = await fetch(`${window.location.origin}/api/authorize`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const json = await response.json();

      if (json.sessionId) {
        window.localStorage.setItem('sessionId', json.sessionId);
        navigate('/');
      }
    }

    exchange();
  }, [navigate]);

  return <div>Authorizing...</div>;
}
