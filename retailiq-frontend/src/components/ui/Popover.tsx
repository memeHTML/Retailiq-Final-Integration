import type { ReactNode } from 'react';

export function Popover({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function PopoverTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function PopoverContent({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export default Popover;
