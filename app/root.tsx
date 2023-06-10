import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from '@remix-run/react';
import { Navbar } from './components/Navbar';

import styles from './antd.min.css';
import reset from 'antd/dist/reset.css';
import { Button } from 'antd';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: reset },
  { rel: 'stylesheet', href: styles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Navbar />

        <Button>xd2d</Button>

        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
