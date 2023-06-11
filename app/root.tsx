import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
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

import tailwindStyles from './tailwind.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: reset },
  { rel: 'stylesheet', href: styles },
  { rel: 'stylesheet', href: tailwindStyles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])
];

export const loader: LoaderFunction = () => {
  return {
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  };
};

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

        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
