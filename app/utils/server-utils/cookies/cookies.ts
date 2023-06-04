import { createCookie } from '@remix-run/node';

const DOMAIN =
  process.env.DOMAIN ||
  `${process.env.CODESPACE_NAME}-3000.preview.app.github.dev`;

export const getCookieExpires = () => new Date(Date.now() + 60_000);

export const sessionIdCookie = createCookie('sessionId', {
  // all of these are optional defaults that can be overridden at runtime
  domain: DOMAIN,
  expires: new Date(Date.now() + 60_000 * 1_000),
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  secure: true
});
