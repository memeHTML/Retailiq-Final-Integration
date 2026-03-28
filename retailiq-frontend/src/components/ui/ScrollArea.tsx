import type { ReactNode } from 'react';

export function ScrollArea({ children }: { children: ReactNode }) {
  return <div style={{ overflow: 'auto' }}>{children}</div>;
}

export default ScrollArea;
