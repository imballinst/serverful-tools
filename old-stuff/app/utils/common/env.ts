import type { RootLoaderData } from '../types/root-loader';

export function isDev(env: RootLoaderData['env']['NODE_ENV']) {
  return env === 'development';
}
