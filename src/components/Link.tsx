import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes } from 'react';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link({ className, ...props }: Props) {
  let externalProps: Partial<Props> = {};
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
