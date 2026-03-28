import type { ImgHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Avatar({ children }: { children: ReactNode }) {
  return <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">{children}</div>;
}

export function AvatarImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} />;
}

export function AvatarFallback({ children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props}>{children}</span>;
}

export default Avatar;
