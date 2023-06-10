import type { V2_MetaFunction } from '@remix-run/node';
import { Navigate } from 'react-router-dom';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }];
};

export default function Index() {
  return typeof window === 'undefined' ? null : <Navigate to="/commits" />;
}
