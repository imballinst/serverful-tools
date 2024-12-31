import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes } from 'react';

export function Link({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  let externalProps: Partial<AnchorHTMLAttributes<HTMLAnchorElement>> = {};
  if (props.href.startsWith('http')) {
    externalProps = {
      target: '_blank',
      rel: 'noopener noreferrer'
    };
  }

  return (
    <a
      {...props}
      {...externalProps}
      className={cn('text-blue-500 hover:text-blue-400', className)}
    />
  );
}
