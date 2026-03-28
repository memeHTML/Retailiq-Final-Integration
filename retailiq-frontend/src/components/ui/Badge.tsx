import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return <span className={`badge badge--${variant} ${className}`} {...props} />;
}

export default Badge;
