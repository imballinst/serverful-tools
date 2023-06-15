import { createCookie } from '@remix-run/node';

const DOMAIN =
  process.env.NODE_ENV === 'development'
    ? process.env.DOMAIN ||
      `${process.env.CODESPACE_NAME}-3000.preview.app.github.dev`
    : 'bb-commit-review.netlify.app';

export const getCookieExpires = () => new Date(Date.now() + 60_000 * 1000);

export const sessionIdCookie = createCookie('sessionId', {
  domain: DOMAIN,
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  secure: true
});
